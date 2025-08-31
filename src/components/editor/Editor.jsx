
import React from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';


 const Editor = ({
  placeholder,
  label,
  error,
  onChange,
  value,
  ...props
}) => {
  const modules = {
    toolbar: [
      [{ header: '1' }, { header: '2' }],
      [{ size: [] }],
      ['bold', 'italic', 'underline', 'strike', 'blockquote'],
      [{ list: 'ordered' }, { list: 'bullet' }, { indent: '-1' }, { indent: '+1' }]
    ]
  };

  const formats = [
    'header',
    'font',
    'size',
    'bold',
    'italic',
    'underline',
    'strike',
    'blockquote',
    'list',
    'bullet',
    'indent',
    'link'
  ];

  return (
    <div className='h-[220px]'>
      <div>{label}</div>
      <ReactQuill
        theme="snow"
        onChange={onChange}
        value={value}
        modules={modules}
        formats={formats}
        bounds=".app"
        placeholder={placeholder}
        tabIndex={-1}
        className='h-[150px]'
        {...props}
      />
      {error && <div className="text-color-error font-small">{error}</div>}
    </div>
  );
};
export default Editor;
