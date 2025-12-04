'use client';

import dynamic from 'next/dynamic';
import { useRef, useCallback } from 'react';
import ReactDOM from 'react-dom';
import 'react-quill/dist/quill.snow.css';

// Polyfill findDOMNode for React Quill compatibility with React 18
if (typeof window !== 'undefined') {
  // @ts-ignore
  if (!ReactDOM.findDOMNode) {
    // @ts-ignore
    ReactDOM.findDOMNode = (node: any) => {
      if (node == null) {
        return null;
      }
      if (node instanceof HTMLElement) {
        return node;
      }
      // For React components, try to get the underlying DOM node
      // This is a simplified polyfill that works for most cases
      return node;
    };
  }
}

const ReactQuill = dynamic(
  async () => {
    const { default: RQ } = await import('react-quill');
    // eslint-disable-next-line react/display-name
    return ({ forwardedRef, ...props }: any) => <RQ ref={forwardedRef} {...props} />;
  },
  {
    ssr: false,
    loading: () => (
      <div className="border border-gray-300 rounded-lg p-4 min-h-[200px] bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Loading editor...</p>
      </div>
    ),
  }
);

interface QuillEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  onImageUpload?: (file: File) => Promise<string>;
}

export default function QuillEditor({ value, onChange, placeholder, onImageUpload }: QuillEditorProps) {
  const quillRef = useRef<any>(null);

  // Handle content changes
  const handleChange = useCallback((content: string) => {
    onChange(content);
  }, [onChange]);

  // Image handler for the toolbar
  const imageHandler = () => {
    const input = document.createElement('input');
    input.setAttribute('type', 'file');
    input.setAttribute('accept', 'image/*');
    input.click();

    input.onchange = async () => {
      const file = input.files?.[0];
      if (file && onImageUpload) {
        try {
          // Show loading in the editor
          const quill = quillRef.current?.getEditor();
          if (quill) {
            const range = quill.getSelection(true);
            quill.insertText(range.index, 'Uploading image...');
            
            // Upload the image
            const imageUrl = await onImageUpload(file);
            
            // Remove the loading text and insert the image
            quill.deleteText(range.index, 'Uploading image...'.length);
            quill.insertEmbed(range.index, 'image', imageUrl);
            quill.setSelection(range.index + 1);
          }
        } catch (error) {
          console.error('Error uploading image:', error);
          alert('Failed to upload image. Please try again.');
        }
      }
    };
  };

  const modules = {
    toolbar: {
      container: [
        [{ header: [1, 2, 3, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ list: 'ordered' }, { list: 'bullet' }],
        [{ color: [] }, { background: [] }],
        ['link', 'image'],
        ['clean'],
      ],
      handlers: {
        image: imageHandler,
      },
    },
  };

  const formats = [
    'header',
    'bold',
    'italic',
    'underline',
    'strike',
    'list',
    'bullet',
    'color',
    'background',
    'link',
    'image',
  ];

  return (
    <div className="quill-wrapper">
      <ReactQuill
        forwardedRef={quillRef}
        theme="snow"
        value={value || ''}
        onChange={handleChange}
        modules={modules}
        formats={formats}
        placeholder={placeholder}
        className="bg-white"
        preserveWhitespace
      />
    </div>
  );
}
