# React Component - Address AutoComplete
## A component with Address AutoComplete functionality

**Create a custom component - ContentFormAutocomplete** `ContentFormAutocomplete.js`


Use PlacesAutocomplete with onChange handler and onSelect handler, proviced from npm package
```javascript
<PlacesAutocomplete
 value={this.state.address}
 onChange={(address) => this.handleChange(address, field, form)}
 onSelect={this.handleSelect}
>
```

Display the related suggestion:

```javascript
{this.state.suggestionDisplay && suggestions.map(suggestion => 
  (
    <div
      {...getSuggestionItemProps(suggestion)} className="suggestion"
    >
      <span>{suggestion.description}</span>
    </div>
   )
)}
```

**Use the ContentFormAutocomplete component at the field you want autoComplete** Ex. `Recruiter.js`

```javascript
<ContentFormAutocomplete 
 setValue={this.setValue} 
 setFormLocation={this.setFormLocation} 
 name="address.fullAddress" 
 label="Address" 
/>
```

Create Related function `setFormLocation`

```javascript
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
```

* This is a bullet point

