# Getting Started

## Preparation

### Installing Dependencies

#### Node, Watchman

We recommend installing Node and Watchman using [Homebrew](http://brew.sh/). Run the following commands in a Terminal after installing Homebrew:
```$xslt
brew install node
brew install watchman
```

#### The React Native CLI

```$xslt
npm install -g react-native-cli
```

#### Xcode

The easiest way to install Xcode is via the [Mac App Store](https://itunes.apple.com/us/app/xcode/id497799835?mt=12). Installing Xcode will also install the iOS Simulator and all the necessary tools to build your iOS app.


## Setup and running

#### Setup your tvOS project:
```$xslt
react-native init YourProjectName --version danilvalov/react-native-appletv
```
#### Run your tvOS project:
```$xslt
cd YourProjectName
react-native run-tvos
```
Your project will be started on the Apple TV emulator.

## Modifying your tvOS app:

#### Now that you have successfully run the app, let's modify it.

* Open `index.tvos.js` in your text editor of choice and edit some lines.
* Hit Command⌘ + R in your tvOS Simulator to reload the app and see your change!

#### That's it!

Congratulations! You've successfully run and modified your first React Native app.

### How to add react-native iOS library to your tvOS project:

If you need to add custom iOS library:

* Install this library to your project by instructions from this library.
  For example:
  ```$xslt
  npm install react-native-idle-timer --save
  ```

* Link this library to your project.
  For example:
  ```$xslt
  react-native link react-native-idle-timer
  ```

* Open your project in Xcode, select the installed library in `Libraries` list and change `Base SDK` option from `iOS` to `tvOS` (or to `Latest tvOS`) like here:
  ![Test](https://cl.ly/0R3C050m0D0X/Image%202016-12-22%20at%2010.02.20%20%D0%9F%D0%9F.png)


# Apple TV changes

This branch includes changes to support building React Native applications on Apple TV.

The changes have been implemented with the intention of supporting existing React Native iOS applications so that few or no changes are required in the Javascript code for the applications.

This branch includes a working version of the UIExplorer example project for Apple TV.

## Build changes

- *Native layer*: For convenience and ease of merging with the existing React Native repository, tvOS applications are built in separate Xcode projects from iOS applications.  Each iOS project now has a corresponding tvOS project with name ending in "TV".
- *Javascript layer*: The packager has been modified to accept a new option, `appletv`.  If `appletv=true` is passed into the URL requested from the packager, the JS bundle will have the global `__APPLETV__` set to true.  This allows applications to expose Apple TV specific behavior, or suppress views that are not supported on Apple TV.

## Code changes

- *General support for tvOS*: Apple TV specific changes in native code are all wrapped by the TARGET_OS_TV define.  These include changes to suppress APIs that are not supported on tvOS (e.g. web views, sliders, switches, status bar, etc.), and changes to support user input from the TV remote or keyboard.
- *TV remote/keyboard input*: A new native class, RCTTVRemoteHandler, sets up gesture recognizers for TV remote events.  Views now have an optional method, onTVNavEvent.  When a TV remote event occurs, the gesture recognizer walks the root view tree, calling onTVNavEvent for any view that has implemented the method.  A component can use this to detect menu button presses or arrow key/swipe gestures, as in the below code snippet from Examples/2048: 

```js
  handleTVNavEvent(evt) {
      if(evt.nativeEvent.eventType === "left") {
        this.setState({board: this.state.board.move(0)});
      } else if(evt.nativeEvent.eventType === "right") {
        this.setState({board: this.state.board.move(2)});
      } else if(evt.nativeEvent.eventType === "up") {
        this.setState({board: this.state.board.move(1)});
      } else if(evt.nativeEvent.eventType === "down") {
        this.setState({board: this.state.board.move(3)});
      } 
  }

  render() {
    .
    .
    .
    return (
      <View
        style={styles.container}
        onTVNavEvent={(event) => this.handleTVNavEvent(event)}
        onTouchStart={(event) => this.handleTouchStart(event)}
```

- *Access to touchable controls*: The View class now has a new optional method, onTVSelect.  Code has been added to RCTView in the native layer to make any view with a non-null onTVSelect method to be focusable and navigable with the TV remote.  If the view is focused and the TV remote select button is pressed, the onTVSelect method is called.  The TouchableHighlight and TouchableOpacity components have these methods implemented such that when they are selected, the onPress method fires as expected.
- *Styling for TV remote navigation*: A view that is focusable and navigable may implement the optional methods onTVFocus and onTVBlur to change view styling as the view goes in and out of focus during navigation with the remote.  TouchableHighlight and TouchableOpacity implement these methods to highlight touchable views as the user navigates through the app.  
- *TV remote animations*: RCTView native code implements Apple-recommended parallax animations to help guide the eye as the user navigates through views.  The animations can be disabled or adjusted with new optional view properties tvParallaxDisable, tvParallaxShiftDistance, tvParallaxTiltAngle, tvParallaxMagnification.
- *Back navigation with the TV remote menu button*: The NavigationExperimental and NavigatorIOS components have views with onTVNavEvent implemented to navigate back as expected.


## Test status

- *Jest tests*: All pass.
- *iOS unit tests*: All pass.
- *iOS integration tests*: All pass.
 
