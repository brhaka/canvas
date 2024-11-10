## Technical challenges we faced regarding React Together

* We faced a problem where some messages (brush strokes) would be lost. That was happening when a second message was sent before the state was updated to contain the first message. That meant that the second message would include `state + second message` instead of `state + first message + second message`.

    While trying to solve this, we realised we needed to know when the state was updated for everyone, so we changed the source code of react-together to add a callback and also thought of using Croquet directly and creating a custom model.
    At the end, we managed to solve this using exclusively react-together by using a local state queue. Since all states, ours and other users', are updated when a new message is sent by someone, we can use a local queue to store messages while the previous states are being updated. We know when they are all updated, or at least should be, when our local state is updated.
    By using `useEffect` on our local state, we can send the current queue.

    **Example code:**
    ```js
    const [strokes, setStrokes] = useStateTogether("strokes", [])
    const [undoStack, setUndoStack] = useStateTogether("undoStack", [])

    useEffect(() => {
        // when this shit changes, we know we can send the second message
        if (queue.length > 0) {
            inBetween = true;
            setStrokes([...strokes, ...queue])
            queue = []
        } else {
            inBetween = false;
        }
    }, [strokes]);

    // Add a stroke to the current user's strokes and update undo stack
    const addStroke = (stroke) => {
        if (inBetween) {
            queue.push(stroke);
        } else {
            inBetween = true;
            setStrokes((prev) => [...prev, stroke])
        }
        setUndoStack((prev) => [...prev, stroke.id])
    }
    ```

* We faced another problem where very long brush strokes would go over the maximum message size and break the app. We solved this by sending multiple messages inside the maximum message size. I.E. we split the long strokes into multiple smaller strokes that were sent to the queue mentioned above.