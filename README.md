# Event Handling

The react-native event system is actually pretty easy to understand, although the details can be more complicated.

+ It's bubbling system. An even starts from the hit-test target, and travels upward.
  + onTouchStart, onTouchEnd are fired.

The EventResponder stuff is more about dragging. If an item becomes the responder, it will keep getting the onResponderMove events, even if the touch points are not outside the responder component. This design allows drag to move in and out of a component as long as the finger stays on the screen.

Responder status might be yielded upward to an ancestor, but never down to another branch.

# In Practice

onTouchStart and onTouchEnd bubbles up the hierarchy. All components along the ancestor path get these events, regardless of responder status.

The first component along bubble up that returns true for `onMoveShouldSetResponder` becomes the responder. It becomes responder only when dragging start.

Tip: I think the parent usually pass a property down to its child to tell it whether it needs to yield responder status.

Question: when could a parent request responder? When the drag is onto it?

hmm... TouchableOpacity doesn't listen to onTouchStart, only onResponderGrant, yet it responds directly to press... what am I doing wrong?

  There's grant on start and grant on move. I used grant-on-move.