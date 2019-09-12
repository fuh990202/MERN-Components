import React from 'react'
import PropTypes from 'prop-types'
import StarRatings from 'react-star-ratings';

import { ContentPane } from '../../../common/content';
import { ContentFormField } from '../../../common/contentform';
import { AvatarUpload } from '../../../common';
import './CompanyDetailsComponent.css';


const CompanyBasicDetails = props => (
  <ContentPane
    bodyStyle={{ position: 'relative' }}
    altBg
  >
    <div style={{ display: 'flex', alignItems: 'center' }}>
      <div
        style={{
          display: 'inline-block',
          width: '4rem',
          textAlign: 'center'
        }}
      >
        <AvatarUpload
          initialURL={props.avatarURL}
          avatarUpload={props.avatarUpload}
          handleAvatarUpload={props.handleAvatarUpload}
          size="4rem"
        />



        <div style={{
          position: 'absolute',
          right: '24%',
          top: '6rem'
        }}>
          <StarRatings
            rating={props.starRating}
            starDimension="0.9rem"
            starSpacing="0.08rem"
            starRatedColor="rgb(252, 201, 2)"
          />
        </div>

      </div>

      <div
        style={{
          display: 'inline-block',
          width: 'calc(100% - 5rem)',
          paddingLeft: 'var(--spacing-md)',
          fontSize: 'var(--font-size-body-2)',
          color: 'var(--alt-font-color)'
        }}
      >
      </div>
    </div>

    <ContentFormField
      name="name"
      label="Company Name"
      containerStyle={{ paddingTop: 'var(--spacing-md)' }}
      labelStyle={{
        color: 'var(--main-font-color)',
        lineHeight: 'var(--label-line-height-md)',
        fontSize: 'var(--font-size-body-2)'
      }}
      inputStyle={{
        marginTop: 'var(--spacing-md)'
      }}
      errorStyle={{
        top: 'calc(var(--spacing-md) + var(--Error-spacing-from-input))'
      }}
      required
    />

    {props.companyId &&
    <div class="companyId-content-form">
      <p class="companyId-title">Company ID</p>
      <div class="companyId-input">
        <p>{props.companyId}</p>
      </div>
    </div>
    }

  </ContentPane>
);

CompanyBasicDetails.propTypes = {
  avatarUpload: PropTypes.object,
  handleAvatarUpload: PropTypes.func,
  starRating: PropTypes.number
};

export { CompanyBasicDetails }
