import React, { Component } from 'react';
import { RegularIcon, DeleteIcon } from '../Icons';
import Modal from 'react-modal';
import RangeSlider from './RangeSlider';
import './AvatarEditModal.css';

import AvatarEditor from 'react-avatar-editor';


class AvatarEditModal extends Component{
  constructor(props) {
    super(props);
    this.state = {
      avatarEditActive: false,
      editor: null,
      scale: 1
    }
    this.openEditModal = this.openEditModal.bind(this);
    this.closeModal = this.closeModal.bind(this);
    this.onClickSave = this.onClickSave.bind(this);
    this.sliderOnChange = this.sliderOnChange.bind(this);
  }

  openEditModal() {
    this.setState({
      avatarEditActive: true,
    })
  }

  closeModal() {
    this.setState({
      avatarEditActive: false,
    })
  }

  onClickSave = () => {
    if (this.state.editor) {
      const canvas = this.state.editor.getImage();
      let file;
      let that = this.props;
      canvas.toBlob(function(blob) {
        file = new File([blob], that.fileName, {
          type: blob.type
        });
        that.handleAvatarUpload(file);
      })
      this.closeModal();
    }
  }
 
  setEditorRef = (editor) => {
    // this.editor = editor
    this.setState({
      editor: editor
    })
  }

  sliderOnChange = value => {
    this.setState({scale: value});
  }
  
  render() {
    return (
      <Modal
        isOpen={this.state.avatarEditActive}
        onRequestClose={this.closeModal}
        style={{
          content: {
            width: '420px',
            height: '520px',
            padding: 'var(--spacing-lg) var(--spacing-lg)',
            overflow: 'auto',
            // maxHeight: 'calc(100vh - 50px)',
            position: 'relative',
            ...this.props.style
          }
        }}
      >
        <RegularIcon
          style={{
            position: 'absolute',
            top: 'var(--spacing-sm)',
            right: 'var(--spacing-sm)',
            cursor: 'pointer'
          }}
          onClick={this.closeModal}
          icon={<DeleteIcon />} 
        />
        <AvatarEditor
          ref={this.setEditorRef}
          image={this.props.editURL}
          width={300}
          height={300}
          border={30}
          borderRadius={200}
          scale={this.state.scale}
        />
        {/* <div style="padding: 0 10px 0 0"> */}
        <RangeSlider
          handleOnChange = {this.sliderOnChange}
          scale = {this.state.scale}
          min = {0.5}
          max = {2.5}
          step = {0.05}
          tooltip = {false}
          orientation = {"horizontal"}
        />
        {/* </div> */}

        <button className="avatar-editor-save-button" type="button" onClick={this.onClickSave}>
          Save
        </button>  
        
      </Modal>
    )
  }
}



export default AvatarEditModal;
