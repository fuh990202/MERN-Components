import React, { Component } from 'react'
import { Link, Redirect } from 'react-router-dom';
import { ClipLoader } from 'react-spinners';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faAngleLeft } from '@fortawesome/free-solid-svg-icons';
import { SegmentEvents } from '../../segmentEvents';

import { getUser, updateUser, createUser } from '../../utils/api';
import { resetPassword } from '../../utils/auth';

import { uploadUserAvatar,deleteUserAvatar } from '../../utils/api/file';
import { createToast } from '../../toast/toast';
import { AvatarUpload } from '../../common/Avatar';
import { Header, HeaderItem } from '../../superadmin/header';
import { ContentPane, ContentColumn, ContentFixedHeader, ContentPageHeader, ContentPageHeaderLayer, ContentPageHeaderButton } from '../../common/content';
import {
  ContentForm,
  ContentFormArray,
  ContentFormDropdown,
  ContentFormField,
  ContentFormFieldCustomLabel,
  ContentFormRow,
  ContentFormPhoneNumber,
  ContentFormAutocomplete
} from '../../common/contentform';
import { userModel } from '../../models'
import { Sidebar } from './sidebar';

class Recruiter extends Component {

  constructor(props) {
    super(props);
    this.state = {
      isLoading: true,
      isValid: true,
      isUpdated: false,
      newRecruiter: false,
      newRecruiterCreated: false,
      recruiter: {...userModel},
      avatarUpload: null,
      agency: null,
      avatarChanged: false,
    };
    this.SubmitHandler = this.SubmitHandler.bind(this);
    this.handleAvatarUpload = this.handleAvatarUpload.bind(this);
  }

  componentDidMount() {
    if (this.props.match.params.id)
      getUser(this.props.match.params.id)
        .then(res => {
          this.setState({
            isLoading: false,
            recruiter: res.data.user
          }, () => {
            let initial = {...this.state.recruiter};
            initial.phoneNumber = initial.phoneNumber ? initial.phoneNumber : '';
            initial.homePhoneNumber = initial.homePhoneNumber ?  initial.homePhoneNumber : '';
            initial.notes = initial.notes ? initial.notes : '';
            initial.address.unit = initial.address.unit ? initial.address.unit : '';
            initial.address.fullAddress = initial.address.fullAddress ? initial.address.fullAddress : '';
            Object.keys(initial.address).map((key) => {
              if(!initial.address[key]){
                initial.address[key] = '';
              }
            });
            this.setState({
              recruiter: initial
            });
          });
        }).catch(() => {
          this.setState((state, props) => ({
            isLoading: false,
            isValid: false
          }));
        });
    else {
      getUser(window.timesaved.user.userId)
        .then(res => {
          let recruiter = this.state.recruiter;
          recruiter.agency = res.data.user.agency._idd
          this.setState({
            agency: res.data.user.agency,
            isLoading: false,
            newRecruiter: true,
            recruiter,
          }, () => {
            let initial = {...this.state.recruiter};
            initial.phoneNumber = initial.phoneNumber ? initial.phoneNumber : '';
            initial.homePhoneNumber = initial.homePhoneNumber ?  initial.homePhoneNumber : '';
            initial.notes = initial.notes ? initial.notes : '';
            this.setState({
              recruiter: initial
            });
          });
        })

    }
  }

  SubmitHandler(values, actions) {
    if (this.state.newRecruiter) {
      values.agency = window.timesaved.user.agencyId;
      values.accessLevel = 1;
      createUser(values)
        .then(res => {
          createToast({
            message: 'Successfully saved changes!',
            level: 'success'
          });
          // Segment Analytics
          window.analytics.track(SegmentEvents.RECRUITER_CREATED, {
            agencyName: window.timesaved.user.agencyName,
            recruiterName: `${window.timesaved.user.firstName} ${window.timesaved.user.lastName}`,
            recruiterEmail: res.data.user.email
          });

          actions.setSubmitting(false);

          const userId = res.data.user._id;

          if (this.state.avatarUpload) {
            uploadUserAvatar(userId, this.state.avatarUpload).then(r => {
              this.setState({
                recruiter: res.data.user,
                newRecruiterCreated: true
              });
            });
          }else{
            this.setState({
              recruiter: res.data.user,
              newRecruiterCreated: true
            });
          }
        })
        .then(res => {
          resetPassword(res.data.user.email)
        })
        .catch(res => {
          createToast({
            message: res.message,
            level: 'error'
          });
        });
    } else {
      updateUser(values._id, values)
        .then(res => {
          const userId = res.data.user._id;

          if (this.state.avatarUpload) {
            uploadUserAvatar(userId, this.state.avatarUpload)
          }else if (this.state.avatarChanged) {
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
          createToast({
            message: res.message,
            level: 'error'
          });
        });
    }

  }

  setFormLocation = (googleLocation) => {
    let parsedLoc = googleLocation.split(', ');
    let autofilled = {...this.state.recruiter};
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
      recruiter: autofilled
    })
  }

  setValue = (value, fieldName) => {
    let updateValue = {...this.state.recruiter};
    if (fieldName.includes(".")){
      let fields = fieldName.split('.');
      updateValue[fields[0]][fields[1]] = value;
    }
    else {
      updateValue[fieldName] = value;
    }
    this.setState({
      recruiter: updateValue
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
        {this.state.newRecruiterCreated && <Redirect to="/settings/recruiters" />}
        {!this.state.isValid && <Redirect to="/404" />}

        <ContentColumn width="25%">
          <Header>
            <HeaderItem width="auto">
              <Link to="/settings/recruiters" style={{ backgroundColor: 'transparent', color: 'var(--alt-font-color)' }}>
                <FontAwesomeIcon icon={faAngleLeft} size="lg" />&nbsp;Recruiters
              </Link>
            </HeaderItem>
          </Header>
          <Sidebar />
        </ContentColumn>
        <ContentColumn width="75%">
          {this.state.isLoading ? <ClipLoader
            css={`margin: 2rem auto;`}
            color="lightgrey"
            sizeUnit="rem"
            size={3}
          /> : <ContentForm
              enableReinitialize
              initialValues={{ ...userModel, ...this.state.recruiter }}
              onSubmit={this.SubmitHandler}
              render={props => {

                return (
                  <>
                    <ContentFixedHeader width="75%">
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
                              // disabled={props.isSubmitting}
                              onClick={props.handleSubmit}
                              color="var(--main-success-color)"
                              label={this.state.newUser ? 'Create User' : 'Save Changes'}
                            />
                          </>
                        }
                      />
                    </ContentFixedHeader>
                    <ContentPageHeader>
                      <ContentPageHeaderLayer />
                    </ContentPageHeader>


                    <ContentPane header="Agency Information" bodyClassName="form-container">
                      <AvatarUpload initialURL={this.state.recruiter.avatarURL} avatarUpload={this.state.avatarUpload} handleAvatarUpload={this.handleAvatarUpload} />
                      <p style={{
                        flexBasis: '100%',
                        width: '100%',
                        fontSize: '20px',
                        marginTop: 'var(--spacing-md)'
                      }}>
                        Personal Information
                      </p>
                      <ContentFormRow>
                        <ContentFormField
                          label="First Name"
                          name="firstName"
                          capitalized
                          required
                          width="50%"
                        />
                        <ContentFormField
                          label="Last Name"
                          name="lastName"
                          capitalized
                          required
                          width="49%"
                        />
                      </ContentFormRow>
                      
                      <ContentFormRow>
                        <ContentFormPhoneNumber
                          label="Mobile Number"
                          name="phoneNumber"
                          width="50%"
                          placeholder="Mobile Number"
                          {...props}
                          required
                        />
                        <ContentFormPhoneNumber
                          label="Home Number"
                          name="homePhoneNumber"
                          width="50%"
                          placeholder="Home Number"
                          {...props}
                        />
                      </ContentFormRow>

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

                      <ContentFormField
                        label="Account Email"
                        name="email"
                        required
                        validate={(value) => {
                          let err;
                          // simple regex to validate email
                          if (!/^[a-zA-Z0-9.-]+@[a-zA-Z0-9.-]+\.[a-zA-Z0-9.-]+/.test(value)) {
                            err = 'Invalid email!';
                          }
                
                          return err;
                        }}
                      />

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
                            if (!/^[a-zA-Z0-9.-]+@[a-zA-Z0-9.-]+\.[a-zA-Z0-9.-]+/.test(value)) {
                              err = 'Invalid email!';
                            }

                            return err;
                          }}
                          customLabel
                        />
                      </ContentFormArray>
                      <p style={{
                        flexBasis: '100%',
                        width: '100%',
                        fontSize: '20px',
                        marginTop: 'var(--spacing-md)'
                      }}>
                        Address
                      </p>
                      <ContentFormAutocomplete 
                        setValue={this.setValue} 
                        setFormLocation={this.setFormLocation} 
                        name="address.fullAddress" 
                        label="Address" 
                      />
                      <ContentFormField 
                        name="address.unit" 
                        label="Apartment/Unit Number (optional)" 
                        setValue={this.setValue} 
                      />
                      {/* <ContentFormField label="Address" name="address.line1" />
                      <ContentFormField label="City" name="address.city" width="19%" />
                      <ContentFormField label="Province" name="address.province" width="10%" />
                      <ContentFormField label="Zip Code" name="address.postalCode" width="19%" /> */}
                      <div style={{ flexBasis: '49%' }}></div>
                      <div
                        style={{
                          height: '1px',
                          width: '100%',
                          opacity: '0.25',
                          backgroundColor: '#212529',
                          marginTop: 'var(--spacing-md)'
                        }}>
                      </div>
                      <ContentFormDropdown
                        width="49%"
                        label='Main Branch'
                        name='branch'
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

                        {/* {branches} */}

                      <ContentFormArray
                        name="branches"
                        label="Side Branches"
                        individualContainerStyle={{
                          justifyContent: 'flex-start'
                        }}
                        selfManageDelete
                        selfManageIndividualWidth
                      >
                        <ContentFormDropdown
                          label='Additional Branch'
                          name='branch'
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

                      <ContentFormField
                        label='Notes'
                        name='notes'
                        category='textarea'
                        height='5rem'
                      />
                    </ContentPane>

                  </>
                );
              }}
            />
          }
        </ContentColumn>

      </>
    )
  }
}

export default Recruiter;
