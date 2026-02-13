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

  const fsEditor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3] } }),
      Image.configure({ inline: false, allowBase64: false }),
      Placeholder.configure({ placeholder: placeholder || 'Digite aqui...' }),
    ],
    content: value || '',
    onUpdate: ({ editor: e }) => onChange(e.getHTML()),
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none min-h-[200px] focus:outline-none px-3 py-2 text-sm',
      },
      handlePaste: (view, event) => {
        const items = event.clipboardData?.items;
        if (!items) return false;
        for (const item of Array.from(items)) {
          if (item.type.startsWith('image/')) {
            event.preventDefault();
            const file = item.getAsFile();
            if (file) {
              uploadImage(file).then(url => {
                if (url && fsEditor) fsEditor.chain().focus().setImage({ src: url }).run();
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
              if (url && fsEditor) fsEditor.chain().focus().setImage({ src: url }).run();
            });
            return true;
          }
        }
        return false;
      },
    },
  });

  // Sync content into fullscreen editor when opening
  React.useEffect(() => {
    if (fullscreen && fsEditor) {
      fsEditor.commands.setContent(value || '');
      setTimeout(() => fsEditor.commands.focus(), 150);
    }
  }, [fullscreen]);

  const handleImageButton = useCallback(() => {
    if (!fsEditor) return;
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const url = await uploadImage(file);
        if (url && fsEditor) fsEditor.chain().focus().setImage({ src: url }).run();
      }
    };
    input.click();
  }, [fsEditor, uploadImage]);

  // Strip HTML for preview
  const plainPreview = React.useMemo(() => {
    if (!value) return '';
    const div = document.createElement('div');
    div.innerHTML = value;
    return div.textContent?.trim() || '';
  }, [value]);

  const hasImages = React.useMemo(() => value?.includes('<img '), [value]);

  return (
    <>
      {/* Collapsed preview – click to open fullscreen */}
      <div
        className={cn(
          'rounded-md border border-input bg-background cursor-pointer hover:border-ring transition-colors',
          className
        )}
        onClick={() => setFullscreen(true)}
      >
        {plainPreview || hasImages ? (
          <div className="px-3 py-2 text-sm text-foreground">
            <p className="line-clamp-2">{plainPreview || '(imagem anexada)'}</p>
            {(plainPreview.length > 100 || hasImages) && (
              <span className="text-xs text-muted-foreground mt-1 inline-flex items-center gap-1">
                <Maximize2 className="w-3 h-3" /> Clique para expandir
              </span>
            )}
          </div>
        ) : (
          <div className="px-3 py-2 text-sm text-muted-foreground/60 flex items-center gap-2">
            <span>{placeholder || 'Digite aqui...'}</span>
            <Maximize2 className="w-3 h-3 ml-auto" />
          </div>
        )}
      </div>

      {/* Fullscreen editor */}
      <Dialog open={fullscreen} onOpenChange={(open) => { if (!open) setFullscreen(false); }}>
        <DialogContent className="max-w-[100vw] w-[100vw] h-[100vh] max-h-[100vh] p-0 rounded-none border-none [&>button]:hidden">
          <div className="flex flex-col h-full bg-background">
            <div className="flex items-center justify-between px-4 py-2 border-b border-border">
              <h3 className="text-sm font-semibold">Editor de Texto</h3>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setFullscreen(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
            {fsEditor && (
              <div className="flex-1 flex flex-col overflow-hidden">
                <div className="flex items-center gap-0.5 border-b border-border px-1 py-1">
                  <Button type="button" variant="ghost" size="icon" className={cn('h-7 w-7', fsEditor.isActive('bold') && 'bg-accent')} onClick={() => fsEditor.chain().focus().toggleBold().run()}>
                    <Bold className="w-3.5 h-3.5" />
                  </Button>
                  <Button type="button" variant="ghost" size="icon" className={cn('h-7 w-7', fsEditor.isActive('italic') && 'bg-accent')} onClick={() => fsEditor.chain().focus().toggleItalic().run()}>
                    <Italic className="w-3.5 h-3.5" />
                  </Button>
                  <Button type="button" variant="ghost" size="icon" className={cn('h-7 w-7', fsEditor.isActive('heading') && 'bg-accent')} onClick={() => fsEditor.chain().focus().toggleHeading({ level: 2 }).run()}>
                    <Heading2 className="w-3.5 h-3.5" />
                  </Button>
                  <Button type="button" variant="ghost" size="icon" className={cn('h-7 w-7', fsEditor.isActive('bulletList') && 'bg-accent')} onClick={() => fsEditor.chain().focus().toggleBulletList().run()}>
                    <List className="w-3.5 h-3.5" />
                  </Button>
                  <Button type="button" variant="ghost" size="icon" className={cn('h-7 w-7', fsEditor.isActive('orderedList') && 'bg-accent')} onClick={() => fsEditor.chain().focus().toggleOrderedList().run()}>
                    <ListOrdered className="w-3.5 h-3.5" />
                  </Button>
                  <div className="w-px h-4 bg-border mx-1" />
                  <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={handleImageButton} title="Inserir imagem">
                    <ImageIcon className="w-3.5 h-3.5" />
                  </Button>
                </div>
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
