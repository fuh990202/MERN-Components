import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Field, ErrorMessage } from 'formik';

import { getDescendantProperty } from './utils';
import PlacesAutocomplete, {
    geocodeByAddress,
} from 'react-places-autocomplete';
import './ContentForm.css';
import { ClipLoader } from 'react-spinners';


class ContentFormAutocomplete extends Component {
  constructor(props) {
    super(props)
    this.state = { 
      address: '',
      suggestionDisplay: true,
      isSelected: true 
    }; 
}

  handleChange(address, field, form) {
    const setValue = this.props.setValue;
    setValue(address, field.name);
    // form.setFieldValue(field.name, address);
    this.setState({ 
      address,
      isSelected: false
     });
  }
    
  handleSelect = (address) => {
    const setFormLocation = this.props.setFormLocation
    this.setState({isSelected: true});

    geocodeByAddress(address)
      .then(function(results){
        console.log("results: ", results)
        setFormLocation(results[0].formatted_address)
      })
      .catch(error => console.error('Error', error))
  }

  onBlurHandler(e) {
    this.setState({suggestionDisplay: false});
  }

  onFocusHandler(e){
    this.setState({suggestionDisplay: true});
  }

  render() {
    //console.log("autocomplete render: ", this.state.address);
    let flexBasis = this.props.width ? this.props.width : '100%';
    let containerStyle = { flexBasis: flexBasis, ...this.props.containerStyle };
    return (
        <div
        style={containerStyle}
        className={`content-form-general-container ${this.props.containerClassName || ''}`}
        >
        
        <Field 
            name={this.props.name}
            validate={value => {
                let err;
                if (this.props.required && value.length === 0) {
                err = 'This field is required';
                } else if (!this.state.isSelected) {
                  err = 'Please select an address';
                }
            return err;
            }}
        >
            
            {({ field, form}) => (
                <>
                {
                    <p className="content-form-field-label"
                    style={{ ...this.props.labelStyle }}>
                    {this.props.label ? this.props.label : this.props.dynamicLabel && field.value.name ? field.value.name : null}
                    {this.props.required && this.props.label && '*'}
                    </p>
                }
                
                    <PlacesAutocomplete
                    value={this.state.address}
                    onChange={(address) => this.handleChange(address, field, form)}
                    onSelect={this.handleSelect}
                    >
                    {({ getInputProps, suggestions, getSuggestionItemProps, loading }) => (
                    <>
                    <input
                        {...getInputProps()}
                        autocomplete="address" //disable autocomplete
                        // onBlur={field.onBlur}
                        onBlur={(e) => {
                          field.onBlur(e);
                          this.onBlurHandler(e);
                        }}
                        onFocus={(e) => {this.onFocusHandler(e)}}
                        value={field.value}
                        name={field.name}
                        //onChange={(address) => this.handleChange(address, field, form)}
                        type={this.props.type ? this.props.type : 'text'}
                        placeholder={this.props.placeholder || ''}
                        className="content-form-general-input"
                        style={{
                        borderColor: form.errors && getDescendantProperty(form.errors, field.name) && getDescendantProperty(form.touched, field.name) ? 'var(--main-error-color)' : null,
                        color: field.value === '' ? 'var(--placeholder-font-color)' : 'var(--main-font-color)',
                        ...this.props.inputStyle
                        }}
                    />
                    <div className="autocomplete-dropdown-container">
                    {loading && <ClipLoader
                        css="margin: 1rem auto;"
                        color="lightgrey"
                        sizeUnit="rem"
                        size={2}
                    />}
                    {this.state.suggestionDisplay && suggestions.map(suggestion => 
                        (
                        <div
                            {...getSuggestionItemProps(suggestion)} className="suggestion"
                        >
                            <span>{suggestion.description}</span>
                        </div>
                        )
                    )}
                    </div>
                    </>
                    )}
                    </PlacesAutocomplete>
                <div className="content-form-general-error-container">    
                    {this.props.charLimit && field.value && field.value.length + 50 > this.props.charLimit && field.value.length <= this.props.charLimit &&
                    < span
                        className="content-form-field-char-limit"
                        style={{
                        top: this.props.height ? `calc(${this.props.height} + var(--spacing-xs))` : 'var(--Error-spacing-from-input)',
                        left: '0',
                        }}
                    >
                        {`${field.value.length}/${this.props.charLimit} characters`}
                    </span>
                    }
                    <ErrorMessage name={this.props.name} render={err => <span className="content-form-field-error" >{err}</span>} />
                </div>

                </>
            )}
            
            </Field>
            
        </div>

        
    );
  }
};

ContentFormAutocomplete.propTypes = {
    // flexBasis of this element, default: 100%
    width: PropTypes.string,
    // whether or not this field is required, default: false
    required: PropTypes.bool,
    // custom error validation, return a String containing a message or undefined for no error
    validate: PropTypes.func,
    // pass in a class name for the div container for custom styling
    containerClassName: PropTypes.string,
    // styling for the div container
    containerStyle: PropTypes.object,
    // optional label for the field
    label: PropTypes.string,
    // placeholder for the field
    placeholder: PropTypes.string,
    // Formik name for the field
    name: PropTypes.string,
    // type of input, default: true
    type: PropTypes.string,
  }

export default ContentFormAutocomplete;
