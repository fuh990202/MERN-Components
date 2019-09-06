import React, { Component } from 'react';
import { ClipLoader } from 'react-spinners';
import { SegmentEvents } from '../../segmentEvents';

import { createToast } from '../../toast/toast';
import {getUser, updateUser, updateUserPassword} from '../../utils/api/user'
import { uploadUserAvatar, deleteUserAvatar } from '../../utils/api/file';
import { resetPassword } from '../../utils/auth';
import PageChangePrompt from '../../common/modal/PageChangePrompt';

import { Sidebar } from './sidebar';
import { ContentForm, ContentFormArray, ContentFormFieldCustomLabel } from '../../common/contentform';
import { AvatarUpload } from '../../common/Avatar';

import {
  ContentFormRow,
  ContentFormItem,
  ContentFormField,
  ContentFormPhoneNumber,
  ContentFormAutocomplete
} from '../../common/experimentalcontentform';

import {
  ContentColumn,
  ContentPane,
  ContentPageHeader,
  ContentPageHeaderLayer,
  ContentPageHeaderButton,
} from '../../common/content';

class Profile extends Component {
  state = {
    confirmedPageLeave: true,
    isLoading: true,
    isValid: true,
    manager: {},
    nextLocation: null,
    avatarUpload: null,
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
    avatarChanged: false,
  };

  componentDidMount = () => this.getProfile();

  getProfile = () => {
    getUser(window.timesaved.user.userId).then(res => {
      // @REMOVE
      // FIX FOR OLD DATA: gets rid of null values
      // make sure to remove in the future
      let user = res.data.user;
      
      if (!user.address){
        user.address = {
          line1: '',
          line2: '',
          city: '',
          province: '',
          postalCode: '',
          fullAddress: '',
          unit: ''
        }
      }

      if (!user.address.unit){
        user.address.unit = '';
      }

      if (!user.address.fullAddress){
        user.address.fullAddress = '';
      }

      user.phoneNumber = user.phoneNumber || '';
      user.homePhoneNumber = user.homePhoneNumber || '';

      this.setState({
        isLoading: false,
        manager: {
          ...user,
          oldPassword: '',
          newPassword: '',
          confirmPassword: ''
        }
      });
    }).catch(res => {
      createToast({
        message: res.message,
        level: 'error'
      });
    });
  };

  //this is for the window.timesaved variables we are/were using
  updateWindowVariable(user){
    window.timesaved.user.email = user.email;
    window.timesaved.user.firstName = user.firstName;
    window.timesaved.user.lastName = user.lastName;
    window.timesaved.user.avatarURL = user.avatarURL;
  }

  handleSubmitForm = (values, actions) => {
    updateUser(this.state.manager._id, values).then(res => {
      if (this.state.avatarUpload) {
        uploadUserAvatar(this.state.manager._id, this.state.avatarUpload).then(res => {
          const new_url = res.data.URL;
          values.avatarURL = new_url;
          this.updateWindowVariable(values);
        });
      } 
      else if (this.state.avatarChanged) {
        deleteUserAvatar(this.state.manager._id).then(res => {
          const new_url = res.data.URL;
          values.avatarURL = new_url;
          this.updateWindowVariable(values);
        });
      }
      createToast({
        message: 'Successfully saved changes.',
        level: 'success'
      });
      if (this.validatePassword()) { this.updatePassword(actions); }
      actions.setSubmitting(false);
    }).catch(res => {
      createToast({
        message: res.message,
        level: 'error'
      });
    });
  };

  handleAvatarUpload = data => {
    this.setState({ 
      avatarUpload: data,
      avatarChanged: true, 
    });
  }

  handleChange = (e, form) => {
    this.setState({ [e.currentTarget.name]: e.currentTarget.value });
    form.setFieldValue(e.currentTarget.name, e.currentTarget.value);
  };
  handleBlur = (e, form) => {
    form.setFieldTouched(e.currentTarget.name);
    if (!this.state.oldPassword) {
      this.setState({ newPassword: '' });
      form.setFieldValue('newPassword', '');
      this.setState({ confirmPassword: '' });
      form.setFieldValue('confirmPassword', '');
    }
  };

  validatePassword = () => {
    return (this.state.oldPassword && this.state.oldPassword.length >= 8) &&
      this.state.newPassword.length >= 8 &&
      this.state.newPassword === this.state.confirmPassword;
  };

  updatePassword = (actions) => {
    updateUserPassword(this.state.manager._id, {
      oldPassword: this.state.oldPassword,
      newPassword: this.state.newPassword
    }).then(() => {
      createToast({
        message: 'Successfully updated the password.',
        level: 'success'
      });
      // Segment Analytics
      window.analytics.track(SegmentEvents.PASSWORD_CHANGED, {
        agencyName: window.timesaved.user.agencyName,
        recruiterName: `${window.timesaved.user.firstName} ${window.timesaved.user.lastName}`
      });     
      this.setState({ oldPassword: '', newPassword: '', confirmPassword: '' });
      actions.resetForm({
        ...this.state.manager,
        oldPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    }).catch(res => {
      createToast({
        message: res.message,
        level: 'error'
      });
    })
  };

  setFormLocation = (googleLocation) => {
    let parsedLoc = googleLocation.split(', ');
    let autofilled = {...this.state.manager};
    autofilled.address.line1 = parsedLoc[0];
    autofilled.address.city = parsedLoc[1];
    autofilled.address.country = parsedLoc[3];
    let parsedProvince = parsedLoc[2].split(' ');
    autofilled.address.province = parsedProvince[0];
    autofilled.address.fullAddress = googleLocation;
    if (parsedProvince[2]){
      // Canadian Postal Code
      autofilled.address.postalCode = parsedProvince[1] + ' ' + parsedProvince[2];
    } else {
      //American Postal Code
      autofilled.address.postalCode = parsedProvince[1] || '';
    }
    this.setState({
      manager: autofilled
    })
  }
  
  setValue = (value, fieldName) => {
    let updateValue = {...this.state.manager};
    if (fieldName.includes(".")){
      let fields = fieldName.split('.');
      updateValue[fields[0]][fields[1]] = value;
    }
    else {
      updateValue[fieldName] = value;
    }
    this.setState({
      manager: updateValue
    });
  }

  render() {
    return (
      <>
        <ContentColumn width="25%">
          <ContentPageHeader>
            <ContentPageHeaderLayer />
          </ContentPageHeader>
          <Sidebar accessLevel={this.state.manager.accessLevel} />
        </ContentColumn>

        <ContentColumn width="75%">
          {this.state.isLoading ? (
            <ClipLoader
              css={`margin: 2rem auto;`}
              color="lightgrey"
              sizeUnit="rem"
              size={3}
            />
          ) : (
              <ContentForm
                enableReinitialize
                initialValues={this.state.manager}
                onSubmit={this.handleSubmitForm}
                render={props => {
                  return (
                    <>
                      <PageChangePrompt when={Object.keys(props.touched).length !== 0} {...this.props} />

                      <ContentPageHeader>
                        <ContentPageHeaderLayer
                          right={
                            <>
                              <ContentPageHeaderButton
                                onClick={() => {
                                  resetPassword(props.values.email)
                                    .then(res => {
                                      createToast({
                                        message: 'Email for resetting password has been sent',
                                        level: 'success'
                                      });
                                      // Segment Analytics
                                      window.analytics.track(SegmentEvents.PASSWORD_RESET, {
                                        agencyName: window.timesaved.user.agencyName,
                                        recruiterName: `${window.timesaved.user.firstName} ${window.timesaved.user.lastName}`
                                      });   
                                    })
                                }}
                                label="Reset Password"
                              />
                              <ContentPageHeaderButton
                                type="submit"
                                disabled={props.isSubmitting}
                                onClick={props.handleSubmit}
                                color="var(--main-success-color)"
                                label={this.state.newUser ? 'Create User' : 'Save Changes'}
                              />
                            </>
                          }
                        />
                      </ContentPageHeader>

                      <ContentPane header="Profile" padding={false}>
                        <ContentFormRow>
                          <div
                            style={{
                              margin: 'var(--spacing-md) 0 var(--spacing-md) var(--spacing-md)'
                            }}>
                            <AvatarUpload initialURL={this.state.manager.avatarURL} avatarUpload={this.state.avatarUpload} handleAvatarUpload={this.handleAvatarUpload} />
                          </div>
                        </ContentFormRow>

                        <ContentPaneHeader>
                          Personal Information
                      </ContentPaneHeader>

                        <ContentFormRow>
                          <ContentFormField
                            label="First Name"
                            name="firstName"
                            required
                          />

                          <ContentFormField
                            label="Last Name"
                            name="lastName"
                            required
                          />
                        </ContentFormRow>

                        <ContentFormRow>
                          <ContentFormPhoneNumber
                            label="Mobile Number"
                            name="phoneNumber"
                            required
                          />
                          <ContentFormPhoneNumber
                            label="Home Number"
                            name="homePhoneNumber"
                          />
                        </ContentFormRow>

                        <ContentFormRow>
                          <ContentFormItem>
                            <ContentFormArray
                              name="phones"
                              label="Phone"
                              individualContainerStyle={{
                                justifyContent: 'flex-start'
                              }}
                              selfManageDelete
                              selfManageIndividualWidth
                            >
                              <ContentFormFieldCustomLabel
                                targetValue="number"
                                label="Number"
                                placeholder="phone number"
                                required
                                formatPhoneNumber
                                customLabel
                              />
                            </ContentFormArray>
                          </ContentFormItem>
                        </ContentFormRow>

                        <ContentFormRow>
                          <ContentFormField
                            label="Account Email"
                            name="email"
                            required
                            validate={(value) => {
                              let err;
                              // simple regex to validate email
                              if (!/^[a-zA-Z0-9.-]+@[a-zA-Z0-9.-]+\.[a-zA-Z0-9.-]{2,}/.test(value)) {
                                err = 'Invalid email!';
                              }

                              return err;
                            }}
                          />
                        </ContentFormRow>

                        <ContentFormRow>
                          <ContentFormItem>
                            <ContentFormArray
                              name="displayEmails"
                              label="email address"
                              individualContainerStyle={{
                                justifyContent: 'flex-start'
                              }}
                              selfManageDelete
                              selfManageIndividualWidth
                            >
                              <ContentFormFieldCustomLabel
                                targetValue="email"
                                label="Email"
                                placeholder="email"
                                required
                                validate={(value) => {
                                  let err;
                                  // simple regex to validate email
                                  if (!/^[a-zA-Z0-9.-]+@[a-zA-Z0-9.-]+\.[a-zA-Z0-9.-]{2,}/.test(value)) {
                                    err = 'Invalid email!';
                                  }

                                  return err;
                                }}
                                customLabel
                              />
                            </ContentFormArray>
                          </ContentFormItem>
                        </ContentFormRow>

                        <ContentPaneHeader>Address</ContentPaneHeader>
                        <ContentFormRow>
                          <ContentFormAutocomplete setValue={this.setValue} setFormLocation={this.setFormLocation} containerStyle={{ padding: '0px 8px' }} name="address.fullAddress" label="Address"/>
                        </ContentFormRow>
                        <ContentFormRow>
                          <ContentFormField name="address.unit" label="Apartment/Unit Number (optional)" setValue={this.setValue} />
                        </ContentFormRow>
                        <ContentPaneHeader>Password</ContentPaneHeader>
                        <ContentFormRow>
                          <ContentFormField
                            label="Old Password"
                            name="oldPassword"
                            onChange={this.handleChange}
                            onBlur={this.handleBlur}
                            value={this.state.oldPassword}
                            type="password"
                            autocomplete="password"
                            width="50%" />
                        </ContentFormRow>
                        <ContentFormRow>
                          <ContentFormField
                            label="New Password"
                            name="newPassword"
                            type="password"
                            autocomplete="password"
                            validate={val => (this.state.oldPassword && val.length < 8) &&
                              'The password must be at least 8 characters long.'}
                            onChange={this.handleChange}
                            onBlur={this.handleBlur}
                            value={this.state.newPassword}
                            disabled={this.state.oldPassword.length < 8}
                            width="50%" />
                        </ContentFormRow>
                        <ContentFormRow>
                          <ContentFormField
                            label="Confirm Password"
                            name="confirmPassword"
                            type="password"
                            autocomplete="password"
                            validate={val => val !== (this.state.oldPassword && this.state.newPassword) &&
                              'The passwords must match.'}
                            onChange={this.handleChange}
                            onBlur={this.handleBlur}
                            value={this.state.confirmPassword}
                            disabled={this.state.oldPassword.length < 8}
                            width="50%" />
                        </ContentFormRow>
                      </ContentPane>
                    </>
                  );
                }}
              />
            )}


        </ContentColumn>
      </>
    )
  }
}

const ContentPaneHeader = props => (
  <p
    style={{
      fontSize: 'var(--font-size-heading-3)',
      padding: 'var(--spacing-md)'
    }}
  >
    {props.children}
  </p>
);

export default Profile
