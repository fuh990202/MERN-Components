import React, { Component } from 'react';
import { Redirect } from 'react-router-dom';
import { ClipLoader } from 'react-spinners';
import { Formik } from 'formik';
import { SegmentEvents } from '../../segmentEvents';

import { createToast } from '../../toast/toast';
import { getAgencies } from '../../utils/api/agency'
import { uploadUserAvatar,deleteUserAvatar } from '../../utils/api/file';
import * as auth from '../../utils/auth';
import { getUser, createUser, updateUser } from '../../utils/api/user';

import { userModel } from '../../models';

import './User.css';
import { Sidebar } from '../sidebar';
import { AvatarUpload } from '../../common/Avatar';

import {
  TitleHeader,
  PhoneNumbers,
  Emails,
  SectionDivider
} from '../common';

import {
  ContentFormSearchBar,
  ContentFormArray,
  ContentFormDropdown
} from '../../common/contentform';

import {
  ContentColumn,
  ContentPane,
  ContentPageHeader,
  ContentPageHeaderLayer,
  ContentPageHeaderButton,
  ContentPageHeaderBackButton
} from '../../common/content';

import {
  ContentFormRow,
  ContentFormField,
  ContentFormItem,
  ContentFormTextarea,
  ContentFormAutocomplete,
  // ContentFormDropdown
} from '../../common/experimentalcontentform'

class User extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isLoading: true,
      isValid: true,
      isTouched: false,
      isUpdated: true,
      newUser: false,
      newUserCreated: false,
      user: null,
      avatarUpload: null,
      avatarChanged: false,
    }

    this.handleAvatarUpload = this.handleAvatarUpload.bind(this);
    this.handleSubmitForm = this.handleSubmitForm.bind(this);
    this.handleResetPassword = this.handleResetPassword.bind(this);
  }

  componentDidMount() {
    if (this.props.match.params.userId) {
      this.loadUser();
    } else {
      let user = { ...userModel }; //shallow copy which is why phone array is still being pointed
      // user.phones = []; //reset phones

      //creating new user models
      // for(let i = 0; i < 2; i++){
      //   user.phones.push({ ...phoneModel });
      // }
      this.setState({
        isLoading: false,
        newUser: true,
        user
      });
    }
  }

  loadUser(){
    getUser(this.props.match.params.userId).then(res => {
      let initial = {...res.data.user};
      initial.phoneNumber = initial.phoneNumber ? initial.phoneNumber : '';
      initial.homePhoneNumber = initial.homePhoneNumber ?  initial.homePhoneNumber : '';
      initial.notes = initial.notes ? initial.notes : '';
      initial.address.city = initial.address.city ? initial.address.city : '';
      initial.address.country = initial.address.country ? initial.address.country : '';
      initial.address.line1 = initial.address.line1 ? initial.address.line1 : '';
      initial.address.line2 = initial.address.line2 ? initial.address.line2 : '';
      initial.address.postalCode = initial.address.postalCode ? initial.address.postalCode : '';
      initial.address.province = initial.address.province ? initial.address.province : '';
      initial.address.fullAddress = initial.address.fullAddress ? initial.address.fullAddress : '';
      initial.address.unit = initial.address.unit ? initial.address.unit : '';

      this.setState({
        isLoading: false,
        user: initial
      },() => {
        console.log("user: ", this.state.user);
      });
    })
    .catch(() => {
      this.setState((state, props) => ({
        isLoading: false,
        isValid: false
      }));
    });
  }

  setFormLocation = (googleLocation) => {
    let parsedLoc = googleLocation.split(', ');
    let autofilled = {...this.state.user};
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
      user: autofilled
    })
  }
  
  setValue = (value, fieldName) => {
    let updateValue = {...this.state.user};
    if (fieldName.includes(".")){
      let fields = fieldName.split('.');
      updateValue[fields[0]][fields[1]] = value;
    }
    else {
      updateValue[fieldName] = value;
    }
    this.setState({
      user: updateValue
    });
  }

  handleSubmitForm(values, actions) {
    
    if(values.branch && values.branch.length === 0){
      //have it set to null for now because of server issues for empty strings
      values.branch = null;
    }
    console.log("values: ", values);

    if (this.state.newUser) {
      values.accessLevel = 2;
      createUser(values)
        .then(res => {
          createToast({
            message: 'Successfully created user! An email has been sent with their password.',
            level: 'success'
          });

          actions.setSubmitting(false);

          const userId = res.data.user._id;

          // handle avatar upload
          if (this.state.avatarUpload) {
            uploadUserAvatar(userId, this.state.avatarUpload).then(r =>{
              this.setState({
                newUserCreated: true,
                user: res.data.user,
                isUpdated: true,
              });
            });
          }else{
            this.setState({
              newUserCreated: true,
              user: res.data.user,
              isUpdated: true,
            });
          }
        })
        .catch(res => {
          // display error message
          createToast({
            message: res.message,
            level: 'error'
          });

          actions.setSubmitting(false);
        });
    } else {
      updateUser(values._id, values)
        .then(res => {
          
          const userId = res.data.user._id;
          // handle avatar upload
          if (this.state.avatarUpload) {
            uploadUserAvatar(userId, this.state.avatarUpload);
          }else if(userId && this.state.avatarChanged){
            deleteUserAvatar(userId);
          }

          createToast({
            message: 'Successfully saved changes!',
            level: 'success'
          });

          this.setState({
            isUpdated: true,
          }, () => {
            actions.setSubmitting(false);
          });
        })
        .catch(res => {
          // display error message
          createToast({
            message: res.message,
            level: 'error'
          });

          actions.setSubmitting(false);
        });
    }
  }

  handleResetPassword() {
    auth.resetPassword(this.state.user.email)
      .then(res => {
        createToast({
          message: 'Successfully reset password!',
          level: 'success'
        });
        // Segment Analytics
        window.analytics.track(SegmentEvents.PASSWORD_RESET, {
          agencyName: window.timesaved.user.agencyName,
          recruiterName: `${window.timesaved.user.firstName} ${window.timesaved.user.lastName}`
        });
      })
      .catch(res => {
        // display error message
        createToast({
          message: res.message,
          level: 'error'
        });
      });
  }

  handleAvatarUpload(data) {
    this.setState({
      avatarUpload: data,
      avatarChanged: true,
    });
  }

  render() {
    return (
      <>
        <ContentColumn width="25%">
          <ContentPageHeader>
            <ContentPageHeaderLayer
              left={
                <ContentPageHeaderBackButton
                  label="Managers"
                  to="/users"
                />
              }
            />
          </ContentPageHeader>
          <Sidebar />
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
              <Formik
                enableReinitialize
                initialValues={this.state.user}
                onSubmit={this.handleSubmitForm}
                render={props => {
                  if (!this.state.isValid) {
                    return <Redirect to="/users" />;
                  }

                  if (this.state.newUserCreated) {
                    return <Redirect to={`/users/${this.state.user._id}`} />;
                  }

                  return (
                    <>
                      <ContentPageHeader>
                        <ContentPageHeaderLayer
                          right={
                            <>
                              <ContentPageHeaderButton
                                onClick={this.handleResetPassword}
                                label="Reset password"
                              />
                              <ContentPageHeaderButton
                                color="var(--main-success-color)"
                                onClick={props.handleSubmit}
                                disabled={props.isSubmitting}
                                label={this.state.newUser ? 'Create Manager' : 'Save Changes'}
                              />
                            </>
                          }
                        />
                      </ContentPageHeader>

                      <ContentPane header="User Information" padding={false}>

                        <div style={{ width: '100%', display: 'flex', justifyContent: 'flex-start', margin: 'var(--spacing-md)' }}>
                          <AvatarUpload initialURL={props.values.avatarURL} avatarUpload={this.state.avatarUpload} handleAvatarUpload={this.handleAvatarUpload} />
                        </div>

                        <TitleHeader>
                          Personal Information
                        </TitleHeader>

                        <ContentFormRow>
                          <ContentFormField
                            name="firstName"
                            label="First Name"
                            required
                          />
                          <ContentFormField
                            name="lastName"
                            label="Last Name"
                            required
                          />
                        </ContentFormRow>

                        <PhoneNumbers formikProps={props} />

                        <ContentFormRow>
                          <ContentFormField
                            name="email"
                            label="Email"
                            width="50%"
                            required
                          />
                        </ContentFormRow>

                        <Emails formikProps={props} />

                        <TitleHeader>
                          Address
                      </TitleHeader>

                      <ContentFormRow>
                        <ContentFormAutocomplete 
                          setValue={this.setValue} 
                          containerStyle={{ padding: '0px 8px' }}
                          setFormLocation={this.setFormLocation}
                          name="address.fullAddress" 
                          label="Address" 
                        />
                      </ContentFormRow>
                      <ContentFormRow>
                        <ContentFormField 
                          name="address.unit" 
                          label="Apartment/Unit Number (optional)" 
                          setValue={this.setValue} 
                        />
                      </ContentFormRow>
                      
                        <SectionDivider />
                        <ContentFormRow>
                          <ContentFormItem width="50%">
                            <ContentFormSearchBar
                              width="50%"
                              label="Agency"
                              name="agency"
                              groupName="agencies"
                              required
                              getAll={getAgencies}
                            />
                          </ContentFormItem>
                          <ContentFormItem width="50%">
                            <ContentFormDropdown
                              name="branch"
                              label="Branch"
                              options={this.state.agency ? this.state.agency.branches.map(value => {
                                return value.name
                              }) : props.values.agency.branches.map(value => {
                                return value.name
                              })}
                              correspondingValue={this.state.agency ? this.state.agency.branches.map(value => {
                                return value._id
                              }) : props.values.agency.branches.map(value => {
                                return value._id
                              })}
                            />
                          </ContentFormItem>
                        </ContentFormRow>

                          <ContentFormArray
                            name="branches"
                            label="Side Branches"
                            individualContainerStyle={{
                              justifyContent: 'flex-start',
                              display: 'inline',
                              width: '50%'
                            }}
                            padding='0 18px 16px'
                            selfManageDelete
                            selfManageIndividualWidth
                          >
                            <ContentFormDropdown
                              label='Additional Branch'
                              name='branch'
                              right='calc(0.5 * var(--spacing-xl))'  
                              options={this.state.agency ? this.state.agency.branches.map(value => {
                                return value.name
                              }) : props.values.agency.branches.map(value => {
                                return value.name
                              })}
                              correspondingValue={this.state.agency ? this.state.agency.branches.map(value => {
                                return value._id
                              }) : props.values.agency.branches.map(value => {
                                return value._id
                              })}
                              required
                            />
                            
                          </ContentFormArray>

                        <ContentFormRow>
                          <ContentFormTextarea
                            name="notes"
                            label="Notes"
                            characterLimit={200}
                            placeholder="200 character limit"
                            style={{ height: '100px' }}
                          />
                        </ContentFormRow>

                      </ContentPane>
                    </>
                  );
                }}
              />
            )}
        </ContentColumn>
      </>
    );
  }
}

export default User;
