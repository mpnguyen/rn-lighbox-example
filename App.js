/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 * @flow
 */

import React, { Component } from 'react';
import {
  StyleSheet, View, Image, TouchableWithoutFeedback, Modal, Animated,
  Text, ScrollView, PanResponder, Dimensions
} from 'react-native';
import SwipeableViews from 'react-swipeable-views-native';

const ANIM_CONFIG = { duration: 300 };

const screenSize = Dimensions.get('window');
const screenWidth = screenSize.width;
const screenHeight = screenSize.height


export default class App extends Component {

  constructor(props) {
    super(props)

    this.open = this.open.bind(this)
    this.handleModalShow = this.handleModalShow.bind(this)
    this.renderFullscreen = this.renderFullscreen.bind(this)
    this.getFullscreenOpacity = this.getFullscreenOpacity.bind(this)

    this.state = {
      origin: {
        x: 0,
        y: 0,
        width: 0,
        height: 0,
      },
      target: {
        x: 0,
        y: 0,
        opacity: 1,
      },
      fullscreen: false,
      animating: false,
      panning: false,
      selectedImageHidden: false,
      slidesDown: false,
    };

    this.openAnim = new Animated.Value(0);
    this.pan = new Animated.Value(0);


    this.panResponder = PanResponder.create({
      onStartShouldSetPanResponder: () => !this.state.animating,
      onStartShouldSetPanResponderCapture: () => !this.state.animating,
      onMoveShouldSetPanResponder: () => !this.state.animating,
      onMoveShouldSetPanResponderCapture: () => !this.state.animating,
      onPanResponderTerminationRequest: () => true,
      // eslint-disable-next-line flowtype/no-weak-types
      onPanResponderMove: (evt, gestureState) => {
        this.pan.setValue(gestureState.dy);

        // eslint-disable-next-line no-magic-numbers
        if (Math.abs(gestureState.dy) > 15 && !this.state.panning) {
          this.pan.setValue(0);
          this.setState({ panning: true });
        }
      },
      onPanResponderRelease: this.handlePanEnd,
      onPanResponderTerminate: this.handlePanEnd,
    });
  }

  animateOpenAnimToValue = (toValue, onComplete) => (
    Animated.timing(this.openAnim, {
      ...ANIM_CONFIG,
      toValue,
    }).start(() => {
      this.setState({ animating: false });
      if (onComplete) {
        onComplete();
      }
    })
  )

  open() {
    this.active.measure((rx, ry, width, height, x, y) => {
      this.setState(
        {
          fullscreen: true,
          animating: true,
          origin: { x, y, width, height },
          target: { x: 0, y: 0, opacity: 1 },
        },
        () => {
          this.animateOpenAnimToValue(1);
        }
      )
    })
  }

  close() {
    this.setState({ animating: true });

    this.active.measure((rx, ry, width, height, x, y) => {
      this.setState({
        origin: { x, y, width, height },
        slidesDown: x + width < 0 || x > screenWidth,
      });

      this.animateOpenAnimToValue(0, () => {
        this.setState({
          fullscreen: false,
          selectedImageHidden: false,
          slidesDown: false,
        });
      });
    });
  }

  // eslint-disable-next-line flowtype/no-weak-types
  handlePanEnd = (evt, gestureState) => {
    // eslint-disable-next-line no-magic-numbers
    if (Math.abs(gestureState.dy) > 50) {
      this.setState({
        panning: false,
        target: {
          x: gestureState.dx,
          y: gestureState.dy,
          opacity: 1 - Math.abs(gestureState.dy / screenHeight),
        },
      });

      this.close();
    } else {
      Animated.timing(this.pan, {
        toValue: 0,
        ...ANIM_CONFIG,
      }).start(() => this.setState({ panning: false }));
    }
  };

  getFullscreenOpacity = () => {
    const { panning, target } = this.state;

    return {
      opacity: panning
        ? this.pan.interpolate({
          inputRange: [-screenHeight, 0, screenHeight],
          outputRange: [0, 1, 0],
        })
        : this.openAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [0, target.opacity],
        }),
    };
  };


  handleModalShow() {
    const { animating, selectedImageHidden } = this.state;

    if (!selectedImageHidden && animating) {
      this.setState({ selectedImageHidden: true });
    }
  }

  getSwipeableStyle = () => {
    const { fullscreen, origin, slidesDown, target } = this.state;

    if (!fullscreen) {
      return { flex: 1 };
    }

    const inputRange = [0, 1];

    return !slidesDown
      ? {
        left: this.openAnim.interpolate({
          inputRange,
          outputRange: [origin.x, target.x],
        }),
        top: this.openAnim.interpolate({
          inputRange,
          outputRange: [origin.y, target.y],
        }),
        width: this.openAnim.interpolate({
          inputRange,
          outputRange: [origin.width, screenWidth],
        }),
        height: this.openAnim.interpolate({
          inputRange,
          outputRange: [origin.height, screenHeight],
        }),
      }
      : {
        left: 0,
        right: 0,
        height: screenHeight,
        top: this.openAnim.interpolate({
          inputRange,
          outputRange: [screenHeight, target.y],
        }),
      };
  };

  renderDefaultHeader = () => (
    <TouchableWithoutFeedback onPress={this.close}>
      <View>
        <Text style={styles.closeText}>Close</Text>
      </View>
    </TouchableWithoutFeedback>
  );

  renderFullscreenContent = () => {
    const { panning } = this.state;
    const containerStyle = [
      this.getSwipeableStyle(),
      panning && { top: this.pan },
    ];

    return (
      <Animated.View style={containerStyle}>
        <ScrollView
          ref={ref => {
            if (ref) {
              // https://github.com/facebook/react-native/issues/11206
              // eslint-disable-next-line no-param-reassign
              ref.scrollResponderHandleStartShouldSetResponder = () => true;
            }
          }}
          contentContainerStyle={styles.fill}
          maximumZoomScale={2} // eslint-disable-line nfo-magic-numbers
          alwaysBounceVertical={false}
        >
          <Image
            source={{ uri: 'https://www.gettyimages.ca/gi-resources/images/Homepage/Hero/UK/CMS_Creative_164657191_Kingfisher.jpg' }}
            style={[styles.fill, { resizeMode: 'contain' }]}
            {...this.panResponder.panHandlers}
          />
        </ScrollView>
      </Animated.View>
    );
  }

  renderFullscreen() {
    const { animating, panning, fullscreen, selectedIdx } = this.state;


    const opacity = this.getFullscreenOpacity();

    return (
      <Modal
        transparent
        visible={fullscreen}
        onShow={this.handleModalShow}
        onRequestClose={this.close}
      >
        <Animated.View style={[styles.modalBackground, opacity]} />
        <SwipeableViews
          disabled={animating || panning}
        // index={}
        // onChangeIndex={this.handleChangeIdx}
        >
          {this.renderFullscreenContent()}
          {this.renderFullscreenContent()}
          {this.renderFullscreenContent()}
        </SwipeableViews>
        <Animated.View style={[opacity, styles.headerContainer]}>
          {this.renderDefaultHeader()}
        </Animated.View>

      </Modal>
    )
  }

  render() {
    const {
      selectedImageHidden,
      fullscreen,
    } = this.state;

    const getOpacity = () => ({
      opacity: selectedImageHidden ? 0 : 1,
    });

    return (
      <View style={styles.container}>
        <TouchableWithoutFeedback onPress={this.open}>
          <View style={getOpacity()}>
            <Image
              ref={ref => this.active = ref}
              source={{ uri: 'https://www.gettyimages.ca/gi-resources/images/Homepage/Hero/UK/CMS_Creative_164657191_Kingfisher.jpg' }}
              style={[styles.image, { resizeMode: "contain" }]}
            />
          </View>
        </TouchableWithoutFeedback>
        {fullscreen && this.renderFullscreen()}
      </View >
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5FCFF',
  },
  image: {
    width: 300,
    height: 300,
  },
  modalBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'black',
  },
  headerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  closeText: {
    color: 'white',
    textAlign: 'right',
    padding: 10,
    margin: 30
  },
  fill: {
    flex: 1,
  },
});
