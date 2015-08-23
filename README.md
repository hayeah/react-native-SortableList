![Sortable List Demo](doc/native-sortable-list-demo.gif)

[Built with React-Motion](https://github.com/chenglou/react-motion).

# React Native Sortable List

(proof-of-concept!)

This is the react-native port of the [react-SortableList](https://github.com/hayeah/react-SortableList) demo. It supports arbitrary number of items, and each item can have different heights. It also include some react-native specific tweaks:

+ The list of items are embedded in a ScrollView.
+ Long-Press to start sorting. During sorting, ScrollView is disabled.
+ Auto-scrolling when a dragged item is near the top or bottom of the screen.

This is just a demo, if you want to play around with it, your best bet (at the moment) is to copy it into your project.

Reusable component coming soon!

# Performance

The animation can feel sluggish in development mode. On iPhone5 it runs at ~15fps if you randomly drag around an item as fast as you can. It turns out that most of the time is spent in dev-mode safety checks.

When running on device be sure to turn on production mode, and you'd get proper ~60fps.

See [Using offline bundle](https://facebook.github.io/react-native/docs/running-on-device-ios.html#using-offline-bundle).

# API

```
<SortableList items={data}>
  {(key) => ... }
</SortableList>
```

Where data is a map of string to data (i.e. `{[string]: any}`). The data items can be polymorphic.

Like react-motion, we use the insertion order of the keys to determine the items ordering.

# How it works

The sortable list tracks the height of its children, and lay them out vertically one after another.

Since we know the dimensions and locations of all children, it's easy to animate them using react-motion whenever the order of the children changes.

On drag, we look at the mouse position and iterates through the list to find an insertion point. Once we know the new ordering, the same code that does the layout animates everything into place.

Ditto with shuffling items.

# React-Native ScrollResponder Patch

When your finger moves on the screen, are you trying to scroll the ScrollView or are you trying to drag an item? The react-native event responder system is used to distinguish between these two use cases.

The key question is "who is the responder?". If the responder is the ScrollView, then touch movement is a scroll. If the responder is a list item, then the touch movement is a drag. At any one time there can only be one responder, so you can't drag an item and scroll at the same time, which makes sense.

The [responder negotiation process](https://github.com/facebook/react-native/blob/4b420cc0956e21f9e9623e460bde42e12d2ddccf/Libraries/vendor/react/browser/eventPlugins/ResponderEventPlugin.js#L184) is pretty much a way to control "should it scroll or should it drag".

Now, ScrollView is special. Usually, it overrides responder precedence and hijack responder status from other components. Say if you press down on a button and start scrolling, it makes sense that the ScrollView should become the responder and cancel the button press.

In our case though, we don't EVER want ScrollView to hijack responder status while we are sorting. The way to do that is to set ScrollView's `scrollEnabled` property to false. This works except for a small bug where programmatic scrolling causes ScrollView to hijack responder status despite that `scrollEnabled` is false.

See: [[ScrollView] Shouldn't become responder if scrollEnabled is false](https://github.com/facebook/react-native/issues/2411).

For now, package.json uses a custom react-native branch that includes this fix.

# TODO

+ Can add and remove items.
+ Builtin pull-to-refresh.
