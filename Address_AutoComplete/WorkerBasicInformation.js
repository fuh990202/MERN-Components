import React, { Component } from 'react'
import { Redirect } from 'react-router-dom';
import { ClipLoader } from 'react-spinners';
import StarRatings from 'react-star-ratings';
import { SegmentEvents } from '../../segmentEvents';

import { createToast } from '../../toast/toast';
import { updateWorker, getWorker, uploadWorkerAvatar, getOnboardingQuestions, deleteWorkerAvatar, getWorkerHistory } from '../../utils/api'
import { StatusFilter } from './workerfilter/component';

import {
  ContentForm,
  ContentFormField,
  ContentFormArray,
  ContentFormRow,
  ContentFormPhoneNumber,
  ContentFormSubmitButton,
  ContentFormFieldCustomLabel,
  ContentFormAutocomplete
} from '../../common/contentform';

import {
  ContentFormDropdown
} from '../../common/experimentalcontentform';

import { RegularIcon, SuccessFailIcon, AvatarUpload, MessagesIcon } from '../../common'
import { Sidebar } from './sidebar';
import WorkerAvailability from './workeravailability/WorkerAvailability';

import './WorkerBasicInformation.css';
import './Worker.css';
import { resetWorkerPassword } from '../../utils/auth';
import {
  ContentColumn,
  ContentPane,
  ContentPageHeader,
  ContentPageHeaderLayer,
  ContentPageHeaderBackButton,
  ContentFixedHeader
} from '../../common/content';

import Verified from '../../resources/verification-verified-filled.svg'
import Unverified from '../../resources/verification-not-verified-filled.svg'

class WorkerBasicInformation extends Component {
  constructor(props) {
    super(props);
    this.state = {
      worker: {},
      workHistoryCount : 0,
      onboardingQuestions: [],
      avatarUpload: null,
      agencyId: window.timesaved.user.agencyId,
      branchNames: (window.timesaved.user.branches).map(item => item.name) || [],
      branchIds: (window.timesaved.user.branches).map(item => item._id) || [],
      months: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
      monthValues: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
      isLoading: true,
      isValid: true,
      availabilityModal: false,
      status : [
        { name: (<p style = {{fontSize: "1em"}}><img src = {Verified} alt='Verified'/>Eligible and Active</p>), active: 0, id: 0},
        { name: (<p style = {{fontSize: "1em"}}><img src = {Verified} alt='Verified'/>Eligible for Hire</p>), active: 0, id: 1},
        // { name: (<p style = {{fontSize: "1em"}}><img src = {Unverified}/>Inactive</p>), active: 0, id: 2},
        // { name: (<p style = {{fontSize: "1em"}}><img src = {Unverified}/>Placed Full Time</p>), active: 0, id: 3},
        // { name: (<p style = {{fontSize: "1em"}}><img src = {Unverified}/>Eligible for Rehire</p>), active: 0, id: 4},
        // { name: (<p style = {{fontSize: "1em"}}><img src = {Unverified}/>Do Not Assign</p>), active: 0, id: 5},
        // { name: (<p style = {{fontSize: "1em"}}><img src = {Unverified}/>Use with Caution</p>), active: 0, id: 6},
        { name: (<p style = {{fontSize: "1em"}}><img src = {Unverified} alt='Unverified'/>Web Pending</p>), active: 0, id: 7},
        { name: (<p style = {{fontSize: "1em"}}><img src = {Unverified} alt='Unverified'/>File Pending</p>), active: 0, id: 8},
      ],
      avatarChanged: false,
    }

    this.options = { year: 'numeric', month: '2-digit', day: '2-digit' };
    this.handleAvatarUpload = this.handleAvatarUpload.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.closeModal = this.closeModal.bind(this);
    this.openModal = this.openModal.bind(this);
    this.resetPassword = this.resetPassword.bind(this);
    this.handleWorkerChat = this.handleWorkerChat.bind(this);
    this.setFormLocation = this.setFormLocation.bind(this);
    this.setValue = this.setValue.bind(this);
    this.changeSelected = this.changeSelected.bind(this);
    this.clearActive = this.clearActive.bind(this);
  }

  componentDidMount() {
    getWorker(this.props.match.params.id)
      .then(res => {
        let worker = res.data.worker;
        // Check if the worker birth date object is in the old ISO string format
        if (typeof worker.birthDate === 'string') {
          worker.birthDate = new Date(worker.birthDate);
          worker.birthDate = {
            year: worker.birthDate.getFullYear(),
            month: worker.birthDate.getMonth() + 1,
            day: worker.birthDate.getDate()
          }
        }
        // Convert to birth date to MM/DD/YYYY format
        if (worker.birthDate && worker.birthDate.year !== null && worker.birthDate.month !== null && worker.birthDate.day !== null) {
          worker.birthDate = new Date(worker.birthDate.year, worker.birthDate.month - 1, worker.birthDate.day).toLocaleDateString("en-US", this.options);
        } else {
          worker.birthDate = '';
        }

        let checkingArray = [
          { value: 'SIN' },
          { value: 'emergencyContactName' },
          { value: 'emergencyContactNumber' },
          { value: 'transportation' },
          { value: 'source' },
          { value: 'employeeId'},
          { value: 'homePhoneNumber'},
          { value: 'notes'},
          { value: 'availabilityRadius', default: 40},
          { value: 'branch'},
          { value: 'externalId'},
          { value: 'verified', default: 0 },
        ]
        checkingArray.forEach(item => {
          if (item.default && !worker[item.value]) {
            worker[item.value] = item.default;
          }
          else if (!worker[item.value]) {
            worker[item.value] = '';
          }
        });

        if(worker.status === 0 || worker.status === 1 || worker.status === 7 || worker.status === 8){
          let index = worker.status >= 7 ? worker.status - 5 : worker.status;
          let status = this.state.status;
          status[index].active = 1
          this.setState({
            status
          })
        }

        if (!worker.address){
          worker.address = {
            line1: '',
            line2: '',
            city: '',
            province: '',
            postalCode: '',
            fullAddress: '',
            unit: ''
          }
        }

        if (!worker.address.unit){
          worker.address.unit = '';
        }

        if (!worker.address.fullAddress){
          worker.address.fullAddress = '';
        }

        console.log(worker);

        this.setState({
          isLoading: false,
          worker
        }, () => {
          getWorkerHistory(this.state.worker._id).then( res => {
            this.setState({
              workHistoryCount : res.data.count
            })
          })
        });
      })
      .catch(() => {
      });

    getOnboardingQuestions(1,1)
    // first 1 for isPublished; second 1 for isDeleted (show all record of onBoarding Question for the worker)
      .then(res => {
        this.setState({
          onboardingQuestions: res.data.onboardQuestions
        });
      })
  }

  handleAvatarUpload(data) {
    this.setState({
      avatarUpload: data,
      avatarChanged: true
    });
  }

  handleSubmit(values, actions) {
    values.status = this.state.status.find(val => val.active === 1) ? this.state.status.find(val => val.active === 1).id : '';
    values.agency = this.state.agencyId;
    if (values.birthDate !== '') {
      values.birthDate = new Date(values.birthDate);
      values.birthDate = {
        year: values.birthDate.getFullYear(),
        month: values.birthDate.getMonth()+1,
        day: values.birthDate.getDate()
      }
    } else {
      values.birthDate = {
        year: null, 
        month: null,
        day: null
      }
    }
    updateWorker(this.props.match.params.id, values)
      .then(res => {
        let worker = res.data.worker;
        // handle avatar upload
        if (this.state.avatarUpload) {
          uploadWorkerAvatar(this.props.match.params.id, this.state.avatarUpload);
        }
        else if (this.state.avatarChanged){
          deleteWorkerAvatar(this.props.match.params.id);
        }

        // Right now this form is only being used to update workers, so don't need to check whether or not this is a new worker and just sending the "Worked Updated" event
        // If it's a new worker, track that a new worker was created. If not, track that a worker was updated.
        window.analytics.track(SegmentEvents.WORKER_UPDATED, {
          agencyName: window.timesaved.user.agencyName,
          recruiterName: `${window.timesaved.user.firstName} ${window.timesaved.user.lastName}`,
          workerName: `${res.data.worker.firstName} ${res.data.worker.lastName}`,
          workerId: res.data.worker._id
        });
        //console.log('worker', res.data.worker);
        

        createToast({
          message: 'Successfully Updated!',
          level: 'success'
        });

        // Check if the worker birth date object is in the old ISO string format
        if (typeof worker.birthDate === 'string') {
          res.data.worker.birthDate = {
            year: worker.birthDate.getFullYear(),
            month: worker.birthDate.getMonth() + 1,
            day: worker.birthDate.getDate()
          }
        }
        // Convert to birth date to MM/DD/YYYY format
        if (worker.birthDate && worker.birthDate.year !== null && worker.birthDate.month !== null && worker.birthDate.day !== null){
          res.data.worker.birthDate = new Date(worker.birthDate.year, worker.birthDate.month - 1, worker.birthDate.day).toLocaleDateString("en-US", this.options);
        } else {
          res.data.worker.birthDate = '';
        }

        if (worker.homePhoneNumber === null) {
          res.data.worker.homePhoneNumber = "";
        }

        if (worker.externalId === null) {
          res.data.worker.externalId = "";
        }

        if (worker.emergencyContactNumber === null) {
          res.data.worker.emergencyContactNumber = "";
        }

        this.setState({
          worker: res.data.worker,
          isUpdated: true,
        }, () => {
          actions.setSubmitting(false);
        });
      })
      .catch(res => {
        // display error message
        if (res.status === 409) {
          res.json().then(res => {
            createToast({
              message: res.message,
              level: 'error'
            });
          })
        }
        else {
          createToast({
            message: res.message,
            level: 'error'
          });
        }
        actions.setSubmitting(false);
      });
  }

  closeModal() {
    this.setState({
      availabilityModal: false
    });
  }

  openModal() {
    this.setState({
      availabilityModal: true
    });
  }

  handleWorkerChat(){
    this.props.history.push({
      pathname: '/messages',
      search: `?worker=${this.state.worker._id}`
    });
  }

  resetPassword() {
    resetWorkerPassword(this.state.worker.email)
      .then(res => {
        createToast({
          message: 'successfully reset worker email',
          level: 'success'
        });
        // Segment Analytics
        window.analytics.track(SegmentEvents.PASSWORD_RESET, {
          agencyName: window.timesaved.user.agencyName,
          recruiterName: `${window.timesaved.user.firstName} ${window.timesaved.user.lastName}`
        });
      })
      .catch(res => {
        createToast({
          message: 'unable to reset the worker password! Something might be happening in the server...',
          level: 'error'
        })
      })
  }

  changeSelected(selected, name) {
    if (selected.length === 0)
      this.setState({
        isFilterChanged: true,
        [name]: this.clearActive(this.state[name])
      });
    else {
      this.setState({
        isFilterChanged: true,
        [name]: selected
      });
    }
  }

  clearActive(value) {
    value = value.map(value => {
      value.active = 0;
      if (value.child) {
        value.child = this.clearActive(value.child);
      }
      return value;
    })
    return value;
  }

  setFormLocation = (googleLocation) => {
    let parsedLoc = googleLocation.split(', ');
    let autofilled = {...this.state.worker};
    
    autofilled.address.line1 = parsedLoc[0];
    autofilled.address.city = parsedLoc[1];
    autofilled.address.country = parsedLoc[3];

    let parsedProvince = parsedLoc[2].split(' ');
    autofilled.address.province = parsedProvince[0];
    // autofilled.address.fullAddress = parsedLoc[0] + ', ' + parsedLoc[1] + ', ' + parsedProvince[0] + ', ' + parsedLoc[3];
    autofilled.address.fullAddress = googleLocation;
    if (parsedProvince[2]){
      // Canadian Postal Code
      autofilled.address.postalCode = parsedProvince[1] + ' ' + parsedProvince[2];
    } else {
      //American Postal Code
      autofilled.address.postalCode = parsedProvince[1] || '';
    }
    this.setState({
      worker: autofilled
    })
  }
  
  setValue = (value, fieldName) => {
    let updateValue = {...this.state.worker};
    if (fieldName.includes(".")){
      let fields = fieldName.split('.');
      updateValue[fields[0]][fields[1]] = value;
    }
    else {
      updateValue[fieldName] = value;
    }
    this.setState({
      worker: updateValue
    });
  }

  render() {
    let lastActive;
    if(this.state.worker.activity && this.state.worker.activity.lastActive) lastActive = new Date(this.state.worker.activity.lastActive);
    return (
      <>
        {!this.state.isValid && <Redirect to="/404" />}
        <ContentColumn width="25%">
          <ContentPageHeader>
            <ContentPageHeaderLayer
              left={
                <ContentPageHeaderBackButton
                  label="Workers"
                  to="/workers"
                />
              }>
            </ContentPageHeaderLayer>
          </ContentPageHeader>
          <Sidebar id={this.props.match.params.id} count = {this.state.workHistoryCount} />
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
                initialValues={this.state.worker}
                onSubmit={this.handleSubmit}
                render={props => {
                  return (
                    <>
                      <WorkerAvailability
                        isOpen={this.state.availabilityModal}
                        close={this.closeModal}
                        availabilities={this.state.worker.availabilities}
                        unavailabilities={this.state.worker.unavailableDates}
                        id={this.props.match.params.id} />

                      <ContentFixedHeader width="75%">
                        <ContentPageHeaderLayer
                          right={
                            <>
                              <button
                                type="button"
                                onClick={this.resetPassword}
                                style={{
                                  marginRight: 'var(--spacing-md)'
                                }}
                              >
                                Reset password
                              </button>
                              <ContentFormSubmitButton>
                                Save Changes
                              </ContentFormSubmitButton>
                            </>
                          }
                        />
                      </ContentFixedHeader>

                      <ContentPageHeader>
                        <ContentPageHeaderLayer />
                      </ContentPageHeader>

                      <ContentPane header={
                        <div className="worker-basic-info-header">
                          <div style={{ display: 'flex', alignItems: 'center' }}>Worker Basic Information</div>
                        </div>
                      }>
                        <div style={{
                          display: 'flex',
                          width: '100%',
                          flexDirection: 'row',
                        }}>
                          <AvatarUpload
                            isExternal ={this.state.worker.externalId}
                            initialURL={this.state.worker.avatarURL}
                            avatarUpload={this.state.avatarUpload}
                            handleAvatarUpload={this.handleAvatarUpload} />
                          <WorkerBasicInformationHeader {...props} changeSelected={this.changeSelected} status ={this.state.status} handleWorkerChat={this.handleWorkerChat} rating={this.state.worker.rating} lastActive={lastActive} openModal={this.openModal} />
                        </div>
                        <WorkerPersonalInformation form={props} months={this.state.months} monthValues = {this.state.monthValues} branchIds={this.state.branchIds} branchNames={this.state.branchNames} setValue={this.setValue}/>
                        <WorkerAddress setFormLocation={this.setFormLocation} setValue={this.setValue}/>
                        <WorkerSideDetails form={props} setValue={this.setValue}/>
                      </ContentPane>
                      <WorkerOnboardingQuestions worker={this.state.worker} onboardingQuestions={this.state.onboardingQuestions} />
                    </>
                  )
                }}
              />
            )}
        </ContentColumn>
      </>
    )
  }
}


const WorkerBasicInformationHeader = props => {
  let status = props.status.find(val => val.active === 1) ? props.status.find(val => val.active === 1).name : '';

  return (
    <table className = "worker-basic-info-header-table" style={{
      width: '70%',
      marginTop: 'var(--spacing-md)',
      marginLeft: 'var(--spacing-xl)'
    }}>
      <colgroup>
        <col width={50} />
        <col width={50} />
        <col width={100} />
      </colgroup>
      <thead>
        <tr 
          style={{
            textAlign: 'left',
            paddingBottom: "10px"
          }}
          className = 'header-row'
        >
          <th style={{width: "120px", maxWidth: "120px",  wordWrap: "break-word", overflow:"hidden"}}>
            <h3>
              {props.values.firstName} {props.values.lastName}
            </h3>
          </th>
          <th>
            <label
              id="import-workers-label"
              onClick = {props.handleWorkerChat}
              className="button is-primary is-outlined">
              <span>
                Message
                <RegularIcon icon={<MessagesIcon />} size="24px" color="var(--main-accent-color)" style={{ cursor: 'pointer' }} />
              </span>
            </label>
          </th>
          <th></th>
        </tr>
      </thead>
      <thead>
        <tr style={{
          textAlign: 'left',
          color: 'var(--alt-font-color)'
        }}>
          <th>Rating</th>
          <th>Hours Worked</th>
          <th>Last Active</th>
        </tr>
      </thead>
      <tbody>
        <tr> 
          <td>
            <StarRatings
              rating={props.rating}
              starDimension="13.3px"
              starRatedColor="rgb(252, 201, 2)"
              numberOfStars={1}
            />
            {props.rating !== -1 ? props.rating.toFixed(1) : " No rating yet"}
          </td>
          <td>
            {props.values.hoursWorked || 0}
          </td>
          <td>
            {props.lastActive ? new Date(props.lastActive).toLocaleDateString('en-US') : "N/A"}
          </td>
        </tr>
      </tbody>
      <thead>
        <tr style={{
          textAlign: 'left',
          color: 'var(--alt-font-color)'
        }}>
          <th>
            <div style={{
              display: 'flex',
              width: '100%',
              flexDirection: 'row',
            }}>
              <div style={{
              marginTop: "3px",
              marginRight: "3px",
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              backgroundColor: 'var(--main-success-color)'
              }}>
              </div>
              Availability (on job)
            </div>
          </th>
          <th>App Installed</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td
            className="worker-availability-clicker"
            onClick={props.openModal}
          >
            See Availability
          </td>
          <td>
            <RegularIcon icon={<SuccessFailIcon indicator={props.values.appInstalled === 1} />} />
          </td>
          <td>
            <StatusFilter
              placeholder = {status}
              status={props.status}
              changeSelected={props.changeSelected}
              icon={false}
              single = {true}
              noReset={true}
            />
          </td>
        </tr>
      </tbody>
    </table>
  )
}

const WorkerAddress = props => {
  return (
  <>
    <div className="form-section">
      <h3>Address</h3>

      <ContentFormAutocomplete
        setFormLocation={props.setFormLocation}
        setValue={props.setValue}
        // name="address.line1"
        name="address.fullAddress"
        label="Address"
        placeholder="address"
        required
      />

      <ContentFormField 
        setValue={props.setValue}
        name="address.unit" 
        label="Apartment/Unit Number (optional)"  
        width="50%"
      />

      <ContentFormRow>
        <ContentFormField
          setValue={props.setValue}
          name="availabilityRadius"
          label="Availability Radius"
          placeholder="Availability Radius"
          width="18.5%"
        />
      </ContentFormRow>
    </div>
    <div className="separation-line" />
  </>
)
  }
const WorkerSideDetails = props => (
  <>
    <div className="form-section">
      <h3>Other Details</h3>
      <ContentFormRow>
        <ContentFormField
          setValue={props.setValue}
          name="externalId"
          label="Employee Number"
          placeholder="Number"
          width="50%"
          readOnly
        />
        <ContentFormField
          setValue={props.setValue}
          label="SIN/Social Security #"
          name="SIN"
          placeholder="Enter the last 3/4 numbers"
          width="50%"
        />
      </ContentFormRow>
      <ContentFormRow>
        <ContentFormField
          setValue={props.setValue}
          name="emergencyContactName"
          label="Emergency Contact Name"
          width="50%"
        />
        <ContentFormPhoneNumber
          setValue={props.setValue}
          name="emergencyContactNumber"
          label="Emergency Contact Number"
          width="50%"
          {...props.form}
        />
      </ContentFormRow>
      <ContentFormRow>
        <ContentFormField
          setValue={props.setValue}
          name="transportation"
          label="Transportation"
          width="50%"
        />
        <ContentFormField
          setValue={props.setValue}
          name="source"
          label="Source"
          width="50%"
        />
      </ContentFormRow>
      <ContentFormField
        setValue={props.setValue}
        name="notes"
        label="Notes"
        category="textarea"
        height="116px"
        placeholder="200 characters"
        charLimit={200}
      />
    </div>
  </>
)


const WorkerPersonalInformation = props => (
  <>
    <div className="form-section">
      <h3>Personal Information</h3>
      <ContentFormRow>
        <ContentFormField
          setValue={props.setValue}
          name="firstName"
          label="First Name"
          width="50%"
          capitalized
          required
        />
        <ContentFormField
          setValue={props.setValue}
          name="lastName"
          label="Last Name"
          capitalized
          width="50%"
          required
        />
      </ContentFormRow>
      <ContentFormRow>
        <ContentFormPhoneNumber
          setValue={props.setValue}
          label="Mobile Number"
          name="phoneNumber"
          width="50%"
          required
          {...props.form}
        />
        <ContentFormPhoneNumber
          setValue={props.setValue}
          label="Home Number"
          name="homePhoneNumber"
          width="50%"
          {...props.form}
        />
      </ContentFormRow>
      <ContentFormArray
        name="phone"
        label="Phone Number"
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
      <ContentFormRow>
        <ContentFormField
          setValue={props.setValue}
          name="email"
          label="Email"
          width="50%"
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
        <ContentFormField
          mask = {true}
          setValue={props.setValue}
          name="birthDate"
          label="Date of Birth"
          placeholder="MM/DD/YYYY"
          width="16.6%"
          validate={(value) => {
            let err;
            if (value.length > 0 && ! /^(0[1-9]|1[0-2])\/(0[1-9]|1\d|2\d|3[01])\/(19|20)\d{2}$/.test(value)) {
              err = 'Invalid date!';
            }
            return err;
          }}
        />
      </ContentFormRow>
      <ContentFormRow>
        <ContentFormDropdown
          setValue={props.setValue}
          name="branch"
          label="Branch Options"
          width="50%"
          options={props.branchNames}
          values={props.branchIds}
          required
        />
      </ContentFormRow>
    </div>
    <div className="separation-line" />
  </>
)

const WorkerOnboardingQuestions = props => (
  <ContentPane header="Onboarding Questions - Answers"
    containerClassName="form-container">
    <div style={{
      display: 'flex',
      fontSize: 'var(--font-size-body-2)',
      flexDirection: 'column'
    }}>
      {props.onboardingQuestions.map((value, index) => {
        return (
          <div key={index} style={{
            color: 'var(--alt-font-color)',
            marginBottom: 'var(--spacing-md)'
          }}>
            {value.name}
            <p style={{
              marginTop: 0,
              display: "flex",
              justifyContent: "space-between",
              color: props.worker.onboardAnswers[index] ? 'var(--main-font-color)' : 'var(--disabled-button-color)'
            }}>
              {props.worker.onboardAnswers[index] && props.worker.onboardAnswers[index].answer ? 
                props.worker.onboardAnswers[index].answer : '_'}
                {props.worker.onboardAnswers[index] && props.worker.onboardAnswers[index].file ?
                <a
                  className={'worker-experience-document-link'}
                  href={props.worker.onboardAnswers[index].file}>{props.worker.onboardAnswers[index].attachment ? props.worker.onboardAnswers[index].attachment : 'Open File'}
                </a>
              : null}
            </p>
          </div>
        )

      })}
    </div>
  </ContentPane>
)



//all props are default props, no need for proptypes

export default WorkerBasicInformation;
