# MERN-Modules
## Documentation for self-created MERN Modules (some useful notes written by Fuhai)

### 1. MERN_App
The basic stucture of MERN application with:
- client stores the front-end code
- server stores the back-end code
- node_modules stores some command and required modules


### 2. Address_autoComplete
- A custom component to provide address autoComplete feature
- While users type the address, a list of corresponded suggestion is displayed (with onChange/onSelect/onBlur)
- dependencies:
    npm:  react-places-autocomplete { PlacesAutocomplete, geocodeByAddress }

### 3. Avatar_Editor
- A custom component to allow user upload and edit avatar with avatar editor
- dependencies:
    npm: AvatarEditor from 'react-avatar-editor' 
