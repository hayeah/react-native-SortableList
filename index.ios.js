/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 */
// 'use strict';

const ReactMotion = {Spring} = require("react-motion/native");
const {reorderKeys} = ReactMotion.utils;

const QUOTES = require("./quotes");

const shuffle = require("./shuffle");

const React = require('react-native');

const {pick} = require("lodash");

var {
  AppRegistry,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ScrollView,
  StatusBarIOS,
} = React;

// StatusBarIOS.setHidden(true);

let ListItem = React.createClass({
  componentDidMount() {
    // const dom = this.refs.li.getDOMNode();
    // const layout = pick(dom,"offsetWidth","offsetHeight");
    // const {id,key,onLayout} = this.props;
    // onLayout && onLayout(id,layout);
  },

  onTouchStart() {
    console.log("item touch start");
  },

  onTouchEnd() {
    console.log("item touch end");
  },

  render() {
    const {
      children,
      style,
      onMouseDown,
      onLayout,
      onTouchStart
    } = this.props;

    var css = ListItem.css;

    return (
      <View style={[css.container,style]}
        onLayout={onLayout}
        onTouchStart={onTouchStart}

        >{children}
      </View>
    );
  },
});

ListItem.css = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(0,0,0,0)',
  },
});

let List = React.createClass({
  getInitialState() {
    const {items} = this.props;
    return {
      layouts: {},
      items,
      // The key of the current item we are moving.
      movingItemKey: null,
      movingY: null,
      scrollEnabled: true,
    };
  },

  componentWillReceiveProps(props) {
    const {items} = props;
    this.setState({items});
  },

  handleItemLayout(key,e) {
    var {layout} = e.nativeEvent;
    // console.log("layout",key,layout);
    const {layouts} = this.state;
    this.setState(({layouts}) => {
      return {
        layouts: {
          ...layouts,
          [key]: layout,
        }
      };
    });
  },

  componentDidMount() {
    // window.addEventListener("mousemove",this.handleMouseMove);
    // window.addEventListener("mouseup",this.handleMouseUp);
  },

  reorderItemsOnMove(e) {
    const {movingItemKey, items} = this.state;

    if(movingItemKey == null) {
      return;
    }

    let rowKey = this.findKeyOfItem(e);

    // Check if cursor is outside the last item. Use the last item's key.
    if(rowKey == null) {
      let keys = Object.keys(items);
      rowKey = keys[keys.length-1];
    }

    // 2. swap items if necessary
    if(rowKey !== movingItemKey) {
      this.setState({
        items: reorderKeys(this.state.items,keys => {
          let a, b;
          keys.forEach((key,i) => {
            // console.log("compare key",key,rowKey,movingItemKey,i);
            if(key == rowKey) {
              a = i
            }

            if(key == movingItemKey) {
              b = i
            }
          });

          const tmp = keys[a];
          keys[a] = keys[b];
          keys[b] = tmp;
          return keys;
        }),
      });

    }
  },

  findKeyOfItem(e) {
    const contentY = this.extractContentY(e);
    const {items,layouts} = this.state;

    let curHeight = 0;

    let rowKey = null;
    let keys = Object.keys(items);
    for(let i = 0; i < keys.length; i++) {
      const key = keys[i];
      const layout = layouts[key];
      curHeight = curHeight + layout.height;
      if(contentY < curHeight) {
        rowKey = key;
        break;
      }
    }

    return rowKey;
  },

  // touch handlers
  onMoveShouldSetResponder() {
    return true;
  },

  extractContentY(e) {
    const {pageY} = e.nativeEvent;
    const {contentOffset} = this.state;
    const contentY = pageY + contentOffset.y;
    return contentY;
  },

  onResponderGrant(e) {
    // Start sorting given a long press.
    // Cancel the timer on release or termination.
    const rowKey = this.findKeyOfItem(e);
    const contentY = this.extractContentY(e);

    this.longpressSelectTimer = setTimeout(() => {


      console.log("selected",rowKey);
      this.setState({
        movingItemKey: rowKey,
        movingY: contentY,
        scrollEnabled: false,
      });
    },500);
  },

  onResponderMove(e) {
    const {pageY} = e.nativeEvent;
    console.log("move y",pageY);
    this.setState({
      movingY: this.extractContentY(e),
    });

    this.reorderItemsOnMove(e);

    if(pageY >= 60 && this._autoScrollingInterval != null) {
      clearInterval(this._autoScrollingInterval);
      this._autoScrollingInterval = null;
    }

    // start auto scrolling up
    if(pageY < 60 && this._autoScrollingInterval == null) {
      console.log("start auto scroll");
      let counter = 0;
      this._autoScrollingInterval = setInterval(() => {
        counter++;
        console.log(this.state.contentOffset);
        if(this.state.contentOffset.y > 0) {
          let dy;
          if(counter > 3) {
            dy = 60;
          } else {
            dy = 30;
          }
          this.scrollBy(-dy);
        }

        // this.setState((state) => ({movingY: state.movingY + 1}));
      },100);
    }

    if(pageY > 500 && this._autoScrollingInterval == null) {
      console.log("start auto scroll");
      let counter = 0;
      this._autoScrollingInterval = setInterval(() => {
        counter++;
        // console.log(this.state.contentOffset);
        // 675 is the screen height
        if(this.state.contentOffset.y < (this._contentHeight - 675)) {
          let dy;
          if(counter > 3) {
            dy = 60;
          } else {
            dy = 30;
          }
          this.scrollBy(dy);
        }

        // this.setState((state) => ({movingY: state.movingY + 1}));
      },100);
    }
  },

  onResponderRelease(e) {
    this.resetMovingItem();
  },

  onResponderTerminationRequest(e) {
    console.log("responder term req",e.nativeEvent);
    if(this._autoScrollingInterval) {
      return false;
    }
    return true;
  },

  // responder status stolen by scrollview
  onResponderTerminate() {
    this.resetMovingItem();
    // console.log("responder terminated");
  },

  resetMovingItem() {
    let tid = this.longpressSelectTimer
    if(tid) {
      clearTimeout(tid);
    }

    let interval = this._autoScrollingInterval;
    if(interval) {
      console.log("clear interval")
      this._autoScrollingInterval = null;
      clearInterval(interval);
    }

    this.setState({
      movingItemKey: null,
      movingY: null,
      scrollEnabled: true,
    });
  },

  scrollBy(offset) {
    this.setState(({contentOffset}) => {
      const y = contentOffset.y + offset;

      const newContentOffset = {
        x: contentOffset.x,
        y: y,
      }


      console.log("scroll to",y);

      this.refs.scrollView.scrollTo(y,contentOffset.x);

      // this.scrollTo()
      // this.refs.scrollView.setNativeProps({
      //   contentOffset: newContentOffset,
      // });
      return newContentOffset;
    });
  },

  renderItems() {
    const dataRenderer = this.props.children;
    if(typeof dataRenderer != 'function') {
      throw "must be a function"
    }

    const {items,movingItemKey,movingY} = this.state;

    // calculate positions using layout dimensions.
    let curHeight = 0;
    const children = Object.keys(items).map((key) => {
        const item = items[key];

        let layout = this.state.layouts[key];

        let style;
        if(layout) {
          style = {
            position: 'absolute',
            top: {val: curHeight},
            width: layout.width,
            scale: {val: 1},
            // opacity: 1,
          }

          curHeight = curHeight + layout.height;
        } else {
          style = {
            top: {val: 0},
            scale: {val: 1},
            // opacity: 1,
          }
        }

        const hasLayout = layout != null;

        const {movingItemKey,movingY} = this.state;
        const isSelected = movingItemKey === key;

        if(isSelected) {
          style = {
            ...style,
            scale: {val: 1.1},
            backgroundColor: '#33366A',
            top: {
              val: movingY - layout.height/2 ,
              config: []
            },
          }
        }


        return (
          <Spring
            key={key}
            endValue={style}
            >
            {({position,top,width,scale,backgroundColor}) => {
              let ss = {
                position,
                // backgroundColor,
                width,
                // top: top.val,
                transform: [{translateY: Math.ceil(top.val-0.5)},{scale: scale.val}],
              };

              return (
                <ListItem key={key}
                  onLayout={this.handleItemLayout.bind(this,key)}
                  style={ss}>
                  {dataRenderer(item)}
                </ListItem>
              );
            }}

          </Spring>

        );
    });

    return {
      contentHeight: curHeight,
      children,
    }
  },

  onScroll(e) {
    const {contentOffset} = e.nativeEvent;
    this._contentOffset = contentOffset;
    this.setState({contentOffset: contentOffset});
  },

  render() {
    const {scrollEnabled,contentOffset} = this.state;
    const {contentHeight,children} = this.renderItems();
    const scrollOffset = this._scrollOffset;

    this._contentHeight = contentHeight;

    // if(scrollOffset) {
    //   this._scrollOffset = null;
    // }


    let css = List.css;

    return (
      <View style={css.container}>
        {/*
        <View style={css.buttonsContainer}>
          <TouchableOpacity onPress={this.scrollDown}>
            <Text style={css.buttonText}>Scroll Down</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={this.scrollUp}>
            <Text style={css.buttonText}>Scroll Up</Text>
          </TouchableOpacity>
        </View>
        */}


        <ScrollView ref="scrollView" scrollEnabled={scrollEnabled}
          scrollEventThrottle={2}
          // contentOffset={scrollOffset && {top: contentOffset.y + scrollOffset}}
          // contentInset={{top: 20}}
          // automaticallyAdjustContentInsets={false}
          onScroll={this.onScroll}>
          <View style={[css.list,{height: contentHeight}]}


            ref="list"
            // onTouchStart={this.onTouchStart}
            // onTouchEnd={this.onTouchEnd}

            onStartShouldSetResponder={this.onMoveShouldSetResponder}
            // onResponderStart={this.onTouchStart}
            onResponderGrant={this.onResponderGrant}
            onResponderMove={this.onResponderMove}
            onResponderRelease={this.onResponderRelease}


            onResponderTerminate={this.onResponderTerminate}
            onResponderTerminationRequest={this.onResponderTerminationRequest}
            // style={{height: contentHeight}}
            >
            {children}
          </View>
        </ScrollView>
      </View>


    );
  }
});

List.css = StyleSheet.create({
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },

  buttonText: {
    marginTop: 20,
    padding: 10,
    color: '#fff',
  },

  container: {
    flex: 1,
  },

  list: {
    flex: 1,
    // backgroundColor: 'rgba(255,0,0,0.3)',
    // alignSelf: 'stretch',
  },
});

const App = React.createClass({
  shuffle() {
    console.log("shuffle yo!");
    const {items} = this.state;

    this.setState({
      items: reorderKeys(items,keys => {
        var keys2= shuffle(keys);
        console.log(keys2);
        return keys
      }),
    });
  },

  getInitialState() {
    let items = {};

    QUOTES.slice(0,10).forEach((quote,i) => {
      // Javascript hash preserves insertion order except for "numeric" keys.
      // Add a random prefix to avoid that.
      items[`@${i}`] = quote;
    });

    return {
      items: items,
    }
  },

  render() {
    const {items} = this.state;
    // console.log(items);
    const css = App.css;

    return (
      <View style={css.container}>

        <List items={items}>
          {item => <Text style={css.quoteText}>{item}</Text>}
        </List>

        {/*

        <View style={css.shuffleContainer}>
          <TouchableOpacity style={css.shuffle} onPress={this.shuffle}>
            <Text style={css.shuffleText}>Shuffle</Text>
          </TouchableOpacity>
        </View>
        */}
      </View>
    );
  },
});

var textBoxStyle = {
  // color: "#B9BBFF",
  borderWidth: 1,
  borderColor: "#B9BBFF",
}

App.css = StyleSheet.create({
  container: {
    // paddingTop: 30,
    flex: 1,
    backgroundColor: "#000445"
  },

  shuffleContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    justifyContent: 'center',
    backgroundColor: "rgba(0,0,0,0.4)"
  },

  shuffle: {
    ...textBoxStyle,
    alignSelf: 'center',
    justifyContent: 'center',
    padding: 10,
    borderWidth: 2,
    borderRadius: 5,
    margin: 10,
    backgroundColor: '#33366A',
  },

  shuffleText: {
    color: "#B9BBFF",
    textAlign: 'center',
    fontWeight: "800",
  },

  quoteText: {
    ...textBoxStyle,
    color: "#B9BBFF",
    fontSize: 18,
    margin: 20,
    marginTop: 0,
    padding: 10,
  },
});


AppRegistry.registerComponent('TryReactMotion', () => App);
