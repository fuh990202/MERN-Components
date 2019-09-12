# React Component - Address AutoComplete
## A component with Avatar Editor

**Create a custom component - AvatarEditModal** `AvatarEditModal.js`


Use AvatarEditor proviced from npm package
```javascript
<AvatarEditor
  ref={this.setEditorRef}
  image={this.props.editURL}
  width={300}
  height={300}
  border={30}
  borderRadius={200}
  scale={this.state.scale}
/>
```

**Create a custom component - AvatarUpload** in `Avatar.js` file

Call AvatarEditModal with required functions

```javascript
<AvatarEditModal
  ref={this.child}
  editURL={this.state.editURL}
  handleAvatarUpload={this.props.handleAvatarUpload}
  fileName={this.state.fileName}
/>
```

**Call the AvatarUpload component**  in `CompanyBasicDetails.js` file

```javascript
<AvatarUpload
  initialURL={props.avatarURL}
  avatarUpload={props.avatarUpload}
  handleAvatarUpload={props.handleAvatarUpload}
  size="4rem"
/>
```



