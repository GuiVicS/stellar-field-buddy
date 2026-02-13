import React, { useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import { supabase } from '@/lib/supabaseClient';
import { Bold, Italic, List, ListOrdered, ImageIcon, Heading2, Maximize2, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
}

const RichTextEditor = ({ value, onChange, placeholder, className }: RichTextEditorProps) => {
  const [fullscreen, setFullscreen] = React.useState(false);

  const uploadImage = useCallback(async (file: File): Promise<string | null> => {
    const ext = file.name.split('.').pop() || 'png';
    const path = `inline/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from('evidences').upload(path, file);
    if (error) {
      console.error('Upload error:', error);
      return null;
    }
    const { data } = await supabase.storage.from('evidences').createSignedUrl(path, 14400);
    return data?.signedUrl || null;
  }, []);

  const editorConfig = useCallback((minH: string) => ({
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3] } }),
      Image.configure({ inline: false, allowBase64: false }),
      Placeholder.configure({ placeholder: placeholder || 'Digite aqui...' }),
    ],
    editorProps: {
      attributes: {
        class: `prose prose-sm max-w-none ${minH} focus:outline-none px-3 py-2 text-sm`,
      },
    },
  }), [placeholder]);

  const editor = useEditor({
    ...editorConfig('min-h-[80px]'),
    content: value || '',
    onUpdate: ({ editor: e }) => onChange(e.getHTML()),
    editorProps: {
      ...editorConfig('min-h-[80px]').editorProps,
      handlePaste: (view, event) => {
        const items = event.clipboardData?.items;
        if (!items) return false;
        for (const item of Array.from(items)) {
          if (item.type.startsWith('image/')) {
            event.preventDefault();
            const file = item.getAsFile();
            if (file) {
              uploadImage(file).then(url => {
                if (url && editor) editor.chain().focus().setImage({ src: url }).run();
              });
            }
            return true;
          }
        }
        return false;
      },
      handleDrop: (view, event) => {
        const files = event.dataTransfer?.files;
        if (!files?.length) return false;
        for (const file of Array.from(files)) {
          if (file.type.startsWith('image/')) {
            event.preventDefault();
            uploadImage(file).then(url => {
              if (url && editor) editor.chain().focus().setImage({ src: url }).run();
            });
            return true;
          }
        }
        return false;
      },
    },
  });

  // Fullscreen editor
  const fsEditor = useEditor({
    ...editorConfig('min-h-[200px]'),
    content: value || '',
    onUpdate: ({ editor: e }) => onChange(e.getHTML()),
  });

  // Sync content when opening fullscreen
  React.useEffect(() => {
    if (fullscreen && fsEditor && editor) {
      fsEditor.commands.setContent(editor.getHTML());
    }
  }, [fullscreen]);

  // Sync back when closing fullscreen
  const handleCloseFullscreen = useCallback(() => {
    if (fsEditor && editor) {
      editor.commands.setContent(fsEditor.getHTML());
    }
    setFullscreen(false);
  }, [fsEditor, editor]);

  const handleImageButton = useCallback((targetEditor: ReturnType<typeof useEditor>) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const url = await uploadImage(file);
        if (url && targetEditor) {
          targetEditor.chain().focus().setImage({ src: url }).run();
        }
      }
    };
    input.click();
  }, [uploadImage]);

  if (!editor) return null;

  const Toolbar = ({ ed }: { ed: NonNullable<ReturnType<typeof useEditor>> }) => (
    <div className="flex items-center gap-0.5 border-b border-border px-1 py-1">
      <Button type="button" variant="ghost" size="icon" className={cn('h-7 w-7', ed.isActive('bold') && 'bg-accent')} onClick={() => ed.chain().focus().toggleBold().run()}>
        <Bold className="w-3.5 h-3.5" />
      </Button>
      <Button type="button" variant="ghost" size="icon" className={cn('h-7 w-7', ed.isActive('italic') && 'bg-accent')} onClick={() => ed.chain().focus().toggleItalic().run()}>
        <Italic className="w-3.5 h-3.5" />
      </Button>
      <Button type="button" variant="ghost" size="icon" className={cn('h-7 w-7', ed.isActive('heading') && 'bg-accent')} onClick={() => ed.chain().focus().toggleHeading({ level: 2 }).run()}>
        <Heading2 className="w-3.5 h-3.5" />
      </Button>
      <Button type="button" variant="ghost" size="icon" className={cn('h-7 w-7', ed.isActive('bulletList') && 'bg-accent')} onClick={() => ed.chain().focus().toggleBulletList().run()}>
        <List className="w-3.5 h-3.5" />
      </Button>
      <Button type="button" variant="ghost" size="icon" className={cn('h-7 w-7', ed.isActive('orderedList') && 'bg-accent')} onClick={() => ed.chain().focus().toggleOrderedList().run()}>
        <ListOrdered className="w-3.5 h-3.5" />
      </Button>
      <div className="w-px h-4 bg-border mx-1" />
      <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleImageButton(ed)} title="Inserir imagem">
        <ImageIcon className="w-3.5 h-3.5" />
      </Button>
    </div>
  );

  return (
    <>
      <div className={cn('rounded-md border border-input bg-background relative', className)}>
        <Toolbar ed={editor} />
        <EditorContent editor={editor} />
        <button
          type="button"
          onClick={() => setFullscreen(true)}
          className="absolute top-1.5 right-1.5 p-1 rounded-md bg-muted/80 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          title="Tela cheia"
        >
          <Maximize2 className="w-3.5 h-3.5" />
        </button>
      </div>

      <Dialog open={fullscreen} onOpenChange={(open) => { if (!open) handleCloseFullscreen(); }}>
        <DialogContent className="max-w-[100vw] w-[100vw] h-[100vh] max-h-[100vh] p-0 rounded-none border-none [&>button]:hidden">
          <div className="flex flex-col h-full bg-background">
            <div className="flex items-center justify-between px-4 py-2 border-b border-border">
              <h3 className="text-sm font-semibold">Editor de Texto</h3>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleCloseFullscreen}>
                <X className="w-4 h-4" />
              </Button>
            </div>
            {fsEditor && (
              <div className="flex-1 flex flex-col overflow-hidden">
                <Toolbar ed={fsEditor} />
                <div className="flex-1 overflow-auto">
                  <EditorContent editor={fsEditor} />
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default RichTextEditor;
