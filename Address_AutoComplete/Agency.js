
import React, { Component } from 'react';
import { Redirect } from 'react-router-dom';
import { ClipLoader } from 'react-spinners';
import { Formik, FieldArray } from 'formik';

import { createToast } from '../../toast/toast';
import { uploadAgencyAvatar, deleteAgencyAvatar} from '../../utils/api/file';
import { getAgency, createAgency, updateAgency } from '../../utils/api';
import { agencyModel } from '../../models';
import { branchModel } from '../../models/agencyModel';

import './Agency.css';
import { Sidebar } from '../sidebar';
import { AvatarUpload } from '../../common/Avatar';

import {
  TitleHeader,
  PhoneNumbers,
  Emails,
  SectionDivider,
  AddNewButton
} from '../common';

import DeleteIcon from '../../resources/delete.svg';
import EditIcon from '../../resources/edit.svg';
import ArrowUpIcon from '../../resources/arrow-up.svg';

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
  ContentFormDropdown,
  ContentFormDateSelector,
  ContentFormTextarea,
  ContentFormAutocomplete
} from '../../common/experimentalcontentform'

class Agency extends Component {
  constructor(props) {
    super(props);

    this.state = {
      isLoading: true,
      isValid: true,
      isTouched: false,
      isUpdated: false,
      newAgency: false,
      newAgencyCreated: false,
      agency: null,
      avatarUpload: null,
      avatarChanged: false
    }

    this.handleAvatarUpload = this.handleAvatarUpload.bind(this);
    this.handleSubmitForm = this.handleSubmitForm.bind(this);
  }

  componentDidMount() {
    if (this.props.match.params.agencyId) {
      getAgency(this.props.match.params.agencyId)
        .then(res => {

          // @WARNING: fix legacy data, remove when all the data is updated!
          let agency = { ...agencyModel, ...res.data.agency };

          agency.ATS = agency.ATS ? agency.ATS : 0;
          agency.appLink.android = agency.appLink.android ? agency.appLink.android : '';
          agency.appLink.ios = agency.appLink.ios ? agency.appLink.ios : '';
          agency.measurementUnit = agency.measurementUnit ? agency.measurementUnit : 0;

          this.setState({
            isLoading: false,
            agency
          });

        })
        .catch(err => {
          this.setState({
            isLoading: false,
            isValid: false
          });
        });
    } else {
      let agency = { ...agencyModel };
      this.setState({
        isLoading: false,
        newAgency: true,
        agency
      });
    }
  }

  handleSubmitForm(values, actions) {
    if (this.state.newAgency) {
      createAgency(values)
        .then(res => {
          createToast({
            message: 'Successfully created agency!',
            level: 'success'
          });

          actions.setSubmitting(false);

          const agencyId = res.data.agency._id;

          // handle avatar upload
          if (this.state.avatarUpload) {
            uploadAgencyAvatar(agencyId, this.state.avatarUpload).then(r => {
              this.setState({
                newAgencyCreated: true,
                agency: res.data.agency,
                isUpdated: true,
              });
            });
          }else{
            this.setState({
              newAgencyCreated: true,
              agency: res.data.agency,
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
        });
    } else {
      updateAgency(this.state.agency._id, values)
        .then(res => {
          // handle avatar upload
          if (this.state.avatarUpload) {
            uploadAgencyAvatar(res.data.agency._id, this.state.avatarUpload);
          } else if(this.state.avatarChanged){
            deleteAgencyAvatar(res.data.agency._id);
          }

          createToast({
            message: 'Successfully saved changes!',
            level: 'success'
          });

          this.setState({
            agency: res.data.agency,
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
        });
    }
  }

  handleAvatarUpload(data) {
    this.setState({
      avatarUpload: data,
      avatarChanged: true,
    });
  }

  setFormLocation = (googleLocation, i, formikProps) => {
    let branches = formikProps.values.branches.slice();
    let parsedLoc = googleLocation.split(', ');
    branches[i].fullAddress = googleLocation;
    branches[i].address = parsedLoc[0];
    branches[i].city = parsedLoc[1];
    branches[i].country = parsedLoc[3];

    let parsedProvince = parsedLoc[2].split(' ');
    branches[i].province = parsedProvince[0];

    if (parsedProvince[2]){
      // Canadian Postal Code
      branches[i].postalCode = parsedProvince[1] + ' ' + parsedProvince[2];
    } else {
      //American Postal Code
      branches[i].postalCode = parsedProvince[1] || '';
    }
    formikProps.setFieldValue('branches', branches);
  }

  setValue = (value, fieldName, i, formikProps) => {
    let branches = formikProps.values.branches.slice();
    branches[i].fullAddress = value;
    formikProps.setFieldValue('branches', branches);
  }

  render() {
    return (
      <>
        <ContentColumn width="25%">
          <ContentPageHeader>
            <ContentPageHeaderLayer
              left={
                <ContentPageHeaderBackButton
                  label="Agencies"
                  to="/agencies"
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
                initialValues={this.state.agency}
                onSubmit={this.handleSubmitForm}
                render={props => {
                  if (!this.state.isValid) {
                    return <Redirect to="/agencies" />;
                  }

                  if (this.state.newAgencyCreated) {
                    return <Redirect to={`/agencies/${this.state.agency._id}`} />;
                  }

                  return (
                    <>
                      <ContentPageHeader>
                        <ContentPageHeaderLayer
                          right={
                            <ContentPageHeaderButton
                              color="var(--main-success-color)"
                              onClick={props.handleSubmit}
                              disabled={props.isSubmitting}
                              label={this.state.newAgency ? 'Create Agency' : 'Save Changes'}
                            />
                          }
                        />
                      </ContentPageHeader>
                      <ContentPane header="Agency Information" padding={false}>

                        <div style={{ width: '100%', display: 'flex', justifyContent: 'flex-start', margin: 'var(--spacing-md)' }}>
                          <AvatarUpload initialURL={props.values.avatarURL} avatarUpload={this.state.avatarUpload} handleAvatarUpload={this.handleAvatarUpload} />
                        </div>

                        <TitleHeader>
                          Agency Information
                        </TitleHeader>

                        <ContentFormRow>
                          <ContentFormField
                            name="name"
                            label="Agency Name"
                            required
                          />
                        </ContentFormRow>

                        <PhoneNumbers formikProps={props} />

                        <ContentFormRow>
                          <ContentFormField
                            name="email"
                            label="Email Address"
                            width="50%"
                            required
                          />
                        </ContentFormRow>

                        <Emails formikProps={props} />

                        <ContentFormRow>
                          <ContentFormField
                            name="website"
                            label="Website"
                            width="50%"
                          />
                        </ContentFormRow>

                        <TitleHeader>
                          Branch Information
                        </TitleHeader>

                        <Branches 
                          formikProps={props} 
                          setFormLocation={this.setFormLocation} 
                          setValue={this.setValue}
                        />

                        <ContentFormRow>
                          <ContentFormField
                            name="appLink.android"
                            label="Google Play Store Link"
                          />
                        </ContentFormRow>

                        <ContentFormRow>
                          <ContentFormField
                            name="appLink.ios"
                            label="Apple App Store Link"
                          />
                        </ContentFormRow>

                        <ContentFormRow>
                          <ContentFormDropdown
                            name="license.trial"
                            width="50%"
                            label="License Type"
                            options={['Trial', 'Premium']}
                          />
                          <ContentFormDateSelector
                            name="license.expiryDate"
                            width="50%"
                            label="Expiry Date"
                          />
                        </ContentFormRow>

                        <ContentFormRow>
                          <ContentFormDropdown
                            name="ATS"
                            width="50%"
                            label="ATS"
                            options={['None', 'Stafftracker', 'Avionte']}
                          />
                          <ContentFormDropdown
                            name="measurementUnit"
                            width="50%"
                            label="Measurement Unit"
                            options={['Miles', 'Kilometers']}
                          />
                        </ContentFormRow>

                        <ContentFormRow>
                          <ContentFormTextarea
                            name="about"
                            label="About"
                            characterLimit={400}
                            placeholder="400 character limit"
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

class Branches extends Component {
  constructor(props) {
    super(props);

    this.state = {
      collapsed: [],
      selectedIdx: -1,
    };

    this.handleAdd = this.handleAdd.bind(this);
    this.handleSave = this.handleSave.bind(this);
  }

  componentDidMount() {
    let collapsed = new Array(this.props.formikProps.values.branches.length);
    collapsed.fill(true);
    this.setState({ collapsed });
  }

  /**
   * Adds a new branch.
   */
  handleAdd() {
    let branches = this.props.formikProps.values.branches.slice();
    branches.push({ ...branchModel });
    this.props.formikProps.setFieldValue('branches', branches);
    this.setState(prevState => ({ collapsed: [...prevState.collapsed, false] }));
  }

  /**
   * Handles the collapsing (saving) of a branch.
   */
  async handleSave(index) {
    // validate fields before collapsing
    // todo improve performance of this checking
    await Object.keys(this.props.formikProps.values.branches[index]).map(async (item) => {
      this.props.formikProps.validateField(`branches[${index}].${item}`);
      this.props.formikProps.setFieldTouched(`branches[${index}].${item}`);
    });

    if (this.props.formikProps.errors.branches) {
      if (Object.keys(this.props.formikProps.errors.branches[index]).length !== 0) {
        return;
      }
    }

    let collapsed = this.state.collapsed.slice();
    collapsed[index] = true;
    this.setState({ collapsed });
  }

  render() {
    return (
      <FieldArray
        name="branches"
        render={arrayHelpers => {
          let branchRows = [];
          let branches = this.props.formikProps.values.branches;
          for (let i = 0; i < branches.length; i++) {
            if (this.state.collapsed[i]) {
              branchRows.push(
                <ContentFormRow key={i}>
                  <ContentFormField
                    name={`branches[${i}].name`}
                    required
                  />
                  <button type="button" 
                    onClick={() => {
                      arrayHelpers.remove(i)
                      let collapsed = this.state.collapsed.slice();
                      collapsed[i] = false;
                      this.setState({collapsed});
                      }} 
                      style={{ height: 'var(--input-height)', padding: 'var(--spacing-sm)' }}>
                    <img src={DeleteIcon} alt="Delete branch" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      let collapsed = this.state.collapsed.slice();
                      collapsed[i] = false;
                      this.setState({ collapsed });
                    }}
                    style={{ height: 'var(--input-height)', padding: 'var(--spacing-sm)' }}
                  >
                    <img src={EditIcon} alt="Edit branch" />
                  </button>
                </ContentFormRow>
              );
            } else {
              branchRows.push(
                <div style={{ position: 'relative' }} key={i}>
                  <div style={{ position: 'absolute', top: 'var(--spacing-sm)', right: 'var(--spacing-sm)' }}>
                    <button type="button" onClick={() => this.handleSave(i)}>
                      <img src={ArrowUpIcon} alt="Collapse branch" />
                    </button>
                  </div>
                  <SectionDivider />

                  <ContentFormRow>
                    <ContentFormField
                      name={`branches[${i}].name`}
                      label="Branch Name"
                      required
                    />
                  </ContentFormRow>

                  <Contacts formikProps={this.props.formikProps} branchIdx={i} />

                  <ContentFormRow>
                    <ContentFormAutocomplete
                      containerStyle={{ padding: '0px 8px' }}
                      setFormLocation={this.props.setFormLocation}
                      setValue={this.props.setValue}
                      name={`branches[${i}].fullAddress`}
                      label="Address"
                      branchIndex={i}
                      formikProps={this.props.formikProps}
                      required
                    />
                  </ContentFormRow>

                  <ContentFormRow>
                    <ContentFormField
                      name={`branches[${i}].unit`}
                      label="Apartment/Unit Number (optional)"
                    />
                  </ContentFormRow>

                  <SocialMedias formikProps={this.props.formikProps} branchIdx={i} />

                  <ContentFormRow>
                    <ContentFormItem style={{ width: 'auto' }}>
                      <button
                        type="button"
                        className="sa-agency-delete-branch-button"
                        onClick={() => arrayHelpers.remove(i)}
                      >
                        Delete Branch
                      </button>
                    </ContentFormItem>
                    <ContentFormItem style={{ width: 'auto' }}>
                      <button
                        type="button"
                        className="sa-agency-save-branch-button"
                        onClick={() => this.handleSave(i)}
                      >
                        Save Branch
                      </button>
                    </ContentFormItem>
                  </ContentFormRow>
                </div>
              );
            }
          }

          return (
            <>
              {branchRows}
              <SectionDivider />
              <AddNewButton onClick={this.handleAdd} message="Add a branch" />
            </>
          );
        }}
      />
    );
  }
}

class Contacts extends Component {
  constructor(props) {
    super(props);

    this.state = {
      selectedIdx: -1,
    };

    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleAddNew = this.handleAddNew.bind(this);
  }

  handleSubmit(values) {
    let contacts = this.props.formikProps.values.branches[this.props.branchIdx].contacts;
    contacts.push({
      ...values,
    });

    this.props.formikProps.setFieldValue(`branches[${this.props.branchIdx}].contacts`, contacts);
    this.setState({
      selectedIdx: -1
    });
  }

  handleAddNew() {
    this.setState({
      selectedIdx: this.props.formikProps.values.branches[this.props.branchIdx].contacts.length
    });
  }

  render() {
    let baseName = `branches[${this.props.branchIdx}].contacts`;
    return (
      <FieldArray
        name={baseName}
        render={arrayHelpers => {
          let contactRows = [];
          let contacts = this.props.formikProps.values.branches[this.props.branchIdx].contacts;

          for (let i = 0; i < contacts.length; i++) {
            if (i === this.state.selectedIdx) {
              contactRows.push(
                <ContentFormRow key={i} style={{ alignItems: 'center' }}>
                  <ContentFormItem width="70%">
                    <div style={{ border: 'var(--main-border)' }}>
                      <ContentFormRow>
                        <ContentFormField
                          name={`${[baseName]}[${i}].name`}
                          width="50%"
                          label="Branch Contact Name"
                          required
                        />
                        <ContentFormField
                          name={`${[baseName]}[${i}].email`}
                          width="50%"
                          label="Branch Contact Email"
                          required
                        />
                      </ContentFormRow>
                      <ContentFormRow>
                        <ContentFormField
                          name={`${[baseName]}[${i}].workNumber`}
                          width="50%"
                          label="Work Number"
                          required
                        />
                        <ContentFormField
                          name={`${[baseName]}[${i}].mobileNumber`}
                          width="50%"
                          label="Mobile Number"
                        />
                      </ContentFormRow>
                      <ContentFormRow>
                        <ContentFormItem>
                          <button className="sa-agency-default-button" type="button" onClick={() => this.setState({ selectedIdx: -1 })}>
                            Save
                          </button>
                        </ContentFormItem>
                      </ContentFormRow>
                    </div>
                  </ContentFormItem>
                  <button type="button" onClick={() => arrayHelpers.remove(i)} style={{ height: 'var(--input-height)', padding: 'var(--spacing-sm)' }}>
                    <img src={DeleteIcon} alt="Delete contact" />
                  </button>
                </ContentFormRow>
              );
            } else {
              contactRows.push(
                <ContentFormRow key={i}>
                  <ContentFormField
                    name={`${[baseName]}[${i}].name`}
                    width="50%"
                    label="Branch Contact Name"
                    required
                  />
                  <button type="button" onClick={() => this.setState({ selectedIdx: i })} style={{ height: 'var(--input-height)', padding: 'var(--spacing-sm)' }}>
                    <img src={EditIcon} alt="Edit contact" />
                  </button>
                  <button type="button" onClick={() => arrayHelpers.remove(i)} style={{ height: 'var(--input-height)', padding: 'var(--spacing-sm)' }}>
                    <img src={DeleteIcon} alt="Delete contact" />
                  </button>
                </ContentFormRow>
              );
            }
          }

          // add new contact
          if (this.state.selectedIdx === contacts.length) {
            contactRows.push(
              <Formik
                initialValues={{ name: '', email: '', workNumber: '', mobileNumber: '' }}
                onSubmit={this.handleSubmit}
                key={this.state.selectedIdx}
                render={props => (
                  <ContentFormRow style={{ alignItems: 'center' }}>
                    <ContentFormItem width="70%">
                      <div style={{ border: 'var(--main-border)' }}>
                        <ContentFormRow>
                          <ContentFormField
                            name="name"
                            width="50%"
                            label="Branch Contact Name"
                            required
                          />
                          <ContentFormField
                            name="email"
                            width="50%"
                            label="Branch Contact Email"
                            required
                          />
                        </ContentFormRow>
                        <ContentFormRow>
                          <ContentFormField
                            name="workNumber"
                            width="50%"
                            label="Work Number"
                            required
                          />
                          <ContentFormField
                            name="mobileNumber"
                            width="50%"
                            label="Mobile Number"
                          />
                        </ContentFormRow>
                        <ContentFormRow>
                          <ContentFormItem>
                            <button className="sa-agency-default-button" onClick={props.handleSubmit}>
                              Create Contact
                            </button>
                          </ContentFormItem>
                        </ContentFormRow>
                      </div>
                    </ContentFormItem>
                    <button type="button" onClick={() => this.setState({ selectedIdx: -1 })} style={{ height: 'var(--input-height)', padding: 'var(--spacing-sm)' }}>
                      <img src={DeleteIcon} alt="Delete contact" />
                    </button>
                  </ ContentFormRow>
                )}
              />
            );
          }

          return (
            <>
              {contactRows}
              {this.state.selectedIdx === -1 && (
                <AddNewButton onClick={this.handleAddNew} message="Add a contact" />
              )}
            </>
          );
        }}
      />
    );
  }
}

class SocialMedias extends Component {
  constructor(props) {
    super(props);

    this.handleAdd = this.handleAdd.bind(this);
  }

  handleAdd() {
    let socialMedias = this.props.formikProps.values.branches[this.props.branchIdx].socialNetworks;
    socialMedias.push({ SNS: 0, link: '' });
    this.props.formikProps.setFieldValue(`branches[${this.props.branchIdx}].socialNetworks`, socialMedias);
  }

  render() {
    let baseName = `branches[${this.props.branchIdx}].socialNetworks`;
    return (
      <FieldArray
        name={baseName}
        render={arrayHelpers => {
          let socialMedias = this.props.formikProps.values.branches[this.props.branchIdx].socialNetworks;
          let socialMediaRows = socialMedias.map((item, index) => (
            <ContentFormRow key={index}>
              <ContentFormDropdown
                name={`${baseName}[${index}].SNS`}
                width="20%"
                options={['Facebook', 'Twitter', 'LinkedIn']}
              />
              <ContentFormField
                name={`${baseName}[${index}].link`}
                width="40%"
                required
              />
              <button type="button" onClick={() => arrayHelpers.remove(index)} style={{ height: 'var(--input-height)', padding: 'var(--spacing-sm)' }}>
                <img src={DeleteIcon} alt="Delete social network" />
              </button>
            </ContentFormRow>

          ));

          socialMediaRows.push(
            <AddNewButton onClick={this.handleAdd} message="Add a media link" />
          );

          return socialMediaRows;
        }}
      />
    );
  }
}

// <PageChangePrompt when={this.state.isTouched} redirectTo={this.state.newAgencyCreated ? `/agencies/${this.state.agency._id}` : ''} {...this.props} />
//   // if (this.state.isUpdated) {
//   props.setTouched({});
//   this.setState({
//     isTouched: false,
//     isUpdated: false
//   });
// }

// if (Object.keys(props.touched).length !== 0 && !this.state.isTouched) {
//   this.setState({
//     isTouched: true
//   });
// }

export default Agency;
