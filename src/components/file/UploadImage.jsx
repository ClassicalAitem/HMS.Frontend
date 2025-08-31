import React from 'react';
import { FilePond, registerPlugin } from 'react-filepond';
import 'filepond/dist/filepond.min.css';

import FilePondPluginImageExifOrientation from 'filepond-plugin-image-exif-orientation';
import FilePondPluginImagePreview from 'filepond-plugin-image-preview';
import 'filepond-plugin-image-preview/dist/filepond-plugin-image-preview.css';

registerPlugin(FilePondPluginImageExifOrientation, FilePondPluginImagePreview);

const UploadImage = ({ ...props }) => {
  return (
    <div className="App">
      <FilePond
        {...props}
        allowReorder={true}
        allowMultiple={true}
        maxFiles={3}
        labelIdle={
          'Drag & Drop your files or <span className="filepond--label-action">Browse</span>'
        }
      />
    </div>
  );
};

export default UploadImage;
