import React, { Component, useState , useCallback, useEffect} from 'react';
import PropTypes from 'prop-types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUpload, faTrash } from '@fortawesome/free-solid-svg-icons';

import './Avatar.css';
import BlankAvatar from '../resources/blank-profile-avatar.png';
import ATSAvatar from '../resources/ATS-logo.png';
import {AvatarEditModal} from '../common/modal'

const Avatar = (props) => {
  const [isImageError, setImageError] = useState(false);

  const handleImageError = useCallback(() => {
    //console.log("handleImageError");
    setImageError(true);
  }, [setImageError]);
  
  useEffect(()=>{
    if (props.url) {
      //console.log(props.url);
      //console.log('imageError: false');
      setImageError(false);
    }
  }, [props.url]);

  return (
    <div
      className="avatar-container"
      style={{
        width: props.containerWidth || props.size,
        height: props.containerHeight || props.size,
        position: props.noRelativePosition ? '' : 'relative',
        display: 'inline-block',
        ...props.containerStyle
      }}
    >
      {
        isImageError ? (
          <div className = "tooltip-icon">
            <img
              src={props.isExternal ? ATSAvatar : BlankAvatar}
              style={{
                width: props.size,
                height: props.size,
                borderRadius: '50%',
                ...props.style
              }}
              alt="avatar"
            />
            {props.isExternal && !props.hideToolTip && (
              <span class={props.isExternal ? props.messageRequest ? "tooltip-text-limited" : "tooltip-text" : ""}> 
                This worker was imported from TempWorks and does not have a TimeSaved account yet.
              </span>
            )}
          </div>
        ) : (
            <img
              src={props.url || ''}
              style={{
                width: props.size,
                height: props.size,
                borderRadius: '50%',
                ...props.style
              }}
              onError={handleImageError}
              alt="avatar"
            />
          )
      }
    </div>
  );
}


Avatar.propTypes = {
  url: PropTypes.string,
  size: PropTypes.string,
  containerWidth: PropTypes.string,
  containerHeight: PropTypes.string
};

class AvatarUpload extends Component {
  constructor(props) {
    super(props);

    this.state = {
      avatarURL: null,
      editURL: null,
      fileName: null,
    };
    this.child = React.createRef();

    this.handleRemove = this.handleRemove.bind(this);
    this.handleAvatarSelect = this.handleAvatarSelect.bind(this);
  }

  componentDidMount() {
    if (this.props.avatarUpload) {
      this.setState({
        avatarURL: URL.createObjectURL(this.props.avatarUpload)
      });
    }else if(this.props.initialURL){
      this.setState({
        avatarURL: this.props.initialURL
      });
    }
  }

  componentDidUpdate(prevProps) {
    if (prevProps.avatarUpload !== this.props.avatarUpload) {
      // free up memory by removing previous avatar
      if (prevProps.avatarUpload) {
        URL.revokeObjectURL(prevProps.avatarUpload);
      }

      // upload new avatar
      if (this.props.avatarUpload) {
        this.setState({
          avatarURL: URL.createObjectURL(this.props.avatarUpload)
        });
      }
    }
  }

  componentWillUnmount() {
    if (this.props.avatarUpload) {
      URL.revokeObjectURL(this.props.avatarUpload);
    }
  }

  handleRemove() {
    if (this.props.avatarUpload) {
      URL.revokeObjectURL(this.props.avatarUpload);
    }
    
    if(this.props.avatarUpload || this.props.initialURL){
      this.setState({
        avatarURL: null
      });
    }
    
    this.props.handleAvatarUpload(null);
  }

  handleAvatarSelect(selectedUrl) {
    this.setState({
      editURL: selectedUrl,
      fileName: selectedUrl.name
    });
    this.child.current.openEditModal();
  }

  render() {
    return (
      <>
      <AvatarEditModal
        ref={this.child}
        editURL={this.state.editURL}
        handleAvatarUpload={this.props.handleAvatarUpload}
        fileName={this.state.fileName}
      />

      <div
        className="avatar-upload-container"
        style={{
          width: this.props.size || '5.125rem',
          height: this.props.size || '5.125rem',
          margin: this.props.margin || ''
        }}
      >

        <Avatar
          url={this.state.avatarURL}
          size={this.props.size || '5.125rem'}
          isExternal={this.props.isExternal}
        />

        <div className="avatar-upload-button-container">
          <label htmlFor="avatar-upload-input">
            <FontAwesomeIcon icon={faUpload} style={{ color: 'var(--main-bg-color)' }} />
          </label>
        </div>

        <div className="avatar-upload-remove-container">
          <button type="button" onClick={this.handleRemove}>
            <FontAwesomeIcon icon={faTrash} style={{ color: 'var(--main-bg-color)' }} />
          </button>
        </div>

        <input
          id="avatar-upload-input"
          type="file"
          name="avatarUpload"
          accept="image/*"
          onChange={(e) => {
            if (e.target.files[0] != null)
              this.handleAvatarSelect(e.target.files[0]);
          }}
          onClick={(e) => e.target.value = null} //need this in order to upload the same avatar
        />

      </div>
      </>
    );
  }
}

AvatarUpload.propTypes = {
  // an object representing the raw image file
  avatarUpload: PropTypes.object,
  // for handling the avatar upload event
  handleAvatarUpload: PropTypes.func.isRequired,
  // margin for the avatar container
  margin: PropTypes.string,
  // the avatar that already existed before
  initialURL: PropTypes.string
};

export { AvatarUpload };
export default Avatar;
