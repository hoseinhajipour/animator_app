var outlineContainer = document.getElementById('outline-container');
playing = false;
playStep = 30;

// Automatic tracking should be turned off when user interaction happened.
trackTimelineMovement = false;
var endFrame = 0;

function generateModel() {
    let rows = [
        {
            title: 'Viseme',
            keyframes: [],
        },

        {
            title: 'Expression',
            keyframes: [],
        },
        {
            title: 'HeadLookAt',
            style: {
                height: 60,
                keyframesStyle: {
                    shape: 'rect',
                    width: 4,
                    height: 60,
                },
            },
        },
        {
            title: 'BodyAnimation',
            keyframes: [
                {
                    val: 0,
                    shape: 'rhomb',
                    type: 'BodyAnimation',
                    value: "walk"
                }
            ],
        },
    ];
    return rows;
}

const rows = generateModel();
var timeline = new timelineModule.Timeline();
timeline.initialize({id: 'timeline', headerHeight: 45});
timeline.setModel({rows: rows});

// Select all elements on key down
document.addEventListener('keydown', function (args) {
    if (args.which === 65 && timeline._controlKeyPressed(args)) {
        timeline.selectAllKeyframes();
        args.preventDefault();
    }
});


var groupStart = false;
timeline.onTimeChanged(function (event) {
    var frame = (timeline.getTime() / 1000) * frameRate;
    if (playing == false) {
        var animationGroups = scene.animationGroups;
        animationGroups.forEach(group => {

            if (groupStart == false) {
                group.play();

                setTimeout(() => {
                    group.pause();
                }, 1);
            }
            group.goToFrame(frame);
        });
        if (MasterAudio.src) {
            MasterAudio.currentTime = timeline.getTime() / 1000;
        }

        showActivePositionInformation();
    } else {
        /*
        if (frame >= endFrame) {
            onStopClick();
        }

         */
    }


});

function onStopClick() {
    timeline.setTime(0);
    var animationGroups = scene.animationGroups;
    animationGroups.forEach(group => {
        //    group.play();
        group.goToFrame(0);

        setTimeout(() => {
            group.stop();
        }, 100);
    });

    playing = false;
    if (timeline) {
        timeline.setOptions({timelineDraggable: true});
    }

    if (MasterAudio.src) {
        MasterAudio.pause();
        MasterAudio.currentTime = 0;
    }


}

function showActivePositionInformation() {
    if (timeline) {
        const fromPx = timeline.scrollLeft;
        const toPx = timeline.scrollLeft + timeline.getClientWidth();
        const fromMs = timeline.pxToVal(fromPx - timeline._leftMargin());
        const toMs = timeline.pxToVal(toPx - timeline._leftMargin());
        let positionInPixels = timeline.valToPx(timeline.getTime()) + timeline._leftMargin();
    }
}

var currentSelected;
timeline.onSelected(function (obj) {

    currentSelected = obj.selected;
    if (obj.selected[0]) {
        if (obj.selected[0].type && obj.selected[0].type === "Viseme") {
            updateActiveButtonByName(obj.selected[0].value);

            var rangeInput = document.getElementById("Expressiveness_range");
            var numberInput = document.getElementById("Expressiveness_number");

            rangeInput.value = obj.selected[0].expression * 100;
            numberInput.value = obj.selected[0].expression * 100;
        }
    }
});
timeline.onDragStarted(function (obj) {
    //  logDraggingMessage(obj, 'dragstarted');
});
timeline.onDrag(function (obj) {

    //  logDraggingMessage(obj, 'drag');
});
timeline.onKeyframeChanged(function (obj) {
    //  console.log('keyframe: ' + obj.val);
});


function shiftKeyframes(animationGroup, offset) {
    for (var i = 0; i < animationGroup.targetedAnimations.length; i++) {
        var targetedAnimation = animationGroup.targetedAnimations[i];
        var animation = targetedAnimation.animation;
        var keys = animation.getKeys();
        for (var j = 0; j < keys.length; j++) {
            if (offset === 0) {
                keys[j].frame -= animationGroup.offset;
            } else if (offset < animationGroup.offset) {
                keys[j].frame -= offset;
            } else {
                keys[j].frame += offset;
            }
        }
        animation.setKeys(keys);
    }
    animationGroup.offset = offset;
    animationGroup.normalize();
}

timeline.onDragFinished(function (obj) {
    console.log(obj.target.row.title);
    var ccurrent_anim_group = scene.getAnimationGroupByName(obj.target.row.title);
    if (ccurrent_anim_group) {
        var new_start = obj.elements[0].keyframe.val / 90;
        shiftKeyframes(ccurrent_anim_group, new_start);
        ccurrent_anim_group._from = obj.target.row.keyframes[0].val / 60;
        ccurrent_anim_group._to = obj.target.row.keyframes[1].val / 60;
    }

});


timeline.onMouseDown(function (obj) {
    var type = obj.target ? obj.target.type : '';
    //  logMessage('mousedown:' + obj.val + '.  target:' + type + '. ' + Math.floor(obj.pos.x) + 'x' + Math.floor(obj.pos.y), 2);
});
timeline.onDoubleClick(function (obj) {
    var type = obj.target ? obj.target.type : '';
    //   logMessage('doubleclick:' + obj.val + '.  target:' + type + '. ' + Math.floor(obj.pos.x) + 'x' + Math.floor(obj.pos.y), 2);
});

timeline.onScroll(function (obj) {
    var options = timeline.getOptions();
    if (options) {
        // Synchronize component scroll renderer with HTML list of the nodes.
        if (outlineContainer) {
            outlineContainer.style.minHeight = obj.scrollHeight + 'px';
            document.getElementById('outline-scroll-container').scrollTop = obj.scrollTop;
        }
    }
    showActivePositionInformation();
});
timeline.onScrollFinished(function (obj) {
    // Stop move component screen to the timeline when user start manually scrolling.
    // logMessage('on scroll finished', 2);
});
generateHTMLOutlineListNodes(rows);

/**
 * Generate html for the left menu for each row.
 * */
function generateHTMLOutlineListNodes(rows) {
    var options = timeline.getOptions();
    var headerElement = document.getElementById('outline-header');
    headerElement.style.maxHeight = headerElement.style.minHeight = options.headerHeight + 'px';
    // headerElement.style.backgroundColor = options.headerFillColor;
    outlineContainer.innerHTML = '';
    rows.forEach(function (row, index) {
        var div = document.createElement('div');
        div.classList.add('outline-node');
        const h = (row.style ? row.style.height : 0) || options.rowsStyle.height;
        div.style.maxHeight = div.style.minHeight = h + 'px';
        div.style.marginBottom = options.rowsStyle.marginBottom + 'px';
        div.innerText = row.title || 'Track ' + index;
        outlineContainer.appendChild(div);
    });
}

/*Handle events from html page*/
function selectMode() {
    if (timeline) {
        timeline.setInteractionMode('selector');
    }
}

function zoomMode() {
    if (timeline) {
        timeline.setInteractionMode('zoom');
    }
}

function noneMode() {
    if (timeline) {
        timeline.setInteractionMode('none');
    }
}

function removeKeyframe() {
    if (timeline) {
        // removeKey keyframe
        currentSelected.forEach(SeletedFrame => {
            const frameToRemove = millisecondsToFrames(SeletedFrame.val);

            if (SeletedFrame.type === "Viseme") {
                var viseme_name = SeletedFrame.value;
                var viseme = findMorph(HeadMesh.morphTargetManager, viseme_name);
                var morphTargetAnimation = viseme.animations.find(function (animation) {
                    return animation.name === viseme_name;
                });
                if (morphTargetAnimation && morphTargetAnimation._keys) {
                    // Find the indices of the keyframes to remove
                    const keyframeIndicesToRemove = [];
                    for (let i = 0; i < morphTargetAnimation._keys.length; i++) {
                        if (morphTargetAnimation._keys[i].frame >= frameToRemove && keyframeIndicesToRemove.length < 3) {
                            keyframeIndicesToRemove.push(i);
                        }
                    }
                    // Remove the keyframes from morphTargetAnimation
                    for (let i = keyframeIndicesToRemove.length - 1; i >= 0; i--) {
                        morphTargetAnimation._keys.splice(keyframeIndicesToRemove[i], 1);
                    }

                } else {
                    console.error("Invalid morphTargetAnimation or keys array.");
                }
            }


            if (SeletedFrame.type === "Expression") {
                var title = "Expression";
                var FaceAnimationGroup = scene.getAnimationGroupByName(HeadMesh.name + "_talk_" + title);
                console.log(FaceAnimationGroup);

                SeletedFrame.blend_shapes.forEach(blend_shape => {
                    var Expression = findMorph(HeadMesh.morphTargetManager, blend_shape.name);
                    var morphTargetAnimationIndex = Expression.animations.findIndex(function (animation) {
                        return animation.name === blend_shape.name;
                    });

                    if (morphTargetAnimationIndex !== -1) {
                        var morphTargetAnimation = Expression.animations[morphTargetAnimationIndex];

                        const keyframeIndicesToRemove = [];

                        // Find the indices of the keyframes to remove
                        for (let i = 0; i < morphTargetAnimation.getKeys().length; i++) {
                            if (morphTargetAnimation.getKeys()[i].frame === frameToRemove) {
                                keyframeIndicesToRemove.push(i);
                            }
                        }

                        // Remove the keyframes from morphTargetAnimation
                        for (let i = keyframeIndicesToRemove.length - 1; i >= 0; i--) {
                            morphTargetAnimation.getKeys().splice(keyframeIndicesToRemove[i], 1);
                        }

                        // If there are no more keyframes, remove the animation from FaceAnimationGroup
                        if (morphTargetAnimation.getKeys().length === 0) {
                            // Find the index of the animation in FaceAnimationGroup
                            const animationIndexToRemove = FaceAnimationGroup.targetedAnimations.findIndex(function (targetedAnimation) {
                                return targetedAnimation.animation === morphTargetAnimation;
                            });

                            // Remove the animation from FaceAnimationGroup
                            if (animationIndexToRemove !== -1) {
                                FaceAnimationGroup.targetedAnimations.splice(animationIndexToRemove, 1);
                            }

                            // Stop the animation if it's playing
                            if (FaceAnimationGroup.isPlaying) {
                                FaceAnimationGroup.stop();
                            }
                        }
                    }
                });
            }


        })


        const currentModel = timeline.getModel();
        if (currentModel && currentModel.rows) {
            currentModel.rows.forEach((row) => {
                if (row.keyframes) {
                    row.keyframes = row.keyframes.filter((p) => !p.selected);
                }
            });
        }
        timeline.setModel(currentModel);


    }
}


function panMode(interactive) {
    if (timeline) {
        timeline.setInteractionMode(interactive ? 'pan' : 'nonInteractivePan');
    }
}

// Set scroll back to timeline when mouse scroll over the outline
function outlineMouseWheel(event) {
    if (timeline) {
        this.timeline._handleWheelEvent(event);
    }
}


function onPlayClick(event) {
    playing = true;
    trackTimelineMovement = true;
    if (timeline) {
        this.moveTimelineIntoTheBounds();
        // Don't allow to manipulate timeline during playing (optional).

        timeline.setOptions({timelineDraggable: false});

        var animationGroups = scene.animationGroups;
        animationGroups.forEach(group => {
            group.stop();
            group.play();

            if (endFrame < group.to) {
                endFrame = group.to;
            }
        });


        if (MasterAudio) {
            MasterAudio.play();
        }
    }
}

function onPauseClick(event) {
    playing = false;
    if (timeline) {
        timeline.setOptions({timelineDraggable: true});
        var animationGroups = scene.animationGroups;
        animationGroups.forEach(group => {
            group.stop();
        });
        if (MasterAudio.src) {
            MasterAudio.pause();
        }

    }
}

function moveTimelineIntoTheBounds() {
    if (timeline) {
        if (timeline._startPos || timeline._scrollAreaClickOrDragStarted) {
            // User is manipulating items, don't move screen in this case.
            return;
        }

        const fromPx = timeline.scrollLeft;
        const toPx = timeline.scrollLeft + timeline.getClientWidth();

        let positionInPixels = timeline.valToPx(timeline.getTime()) + timeline._leftMargin();
        // Scroll to timeline position if timeline is out of the bounds:
        if (positionInPixels <= fromPx || positionInPixels >= toPx) {
            this.timeline.scrollLeft = positionInPixels;
        }
    }
}

function initPlayer() {
    setInterval(() => {
        if (playing) {
            if (timeline) {
                timeline.setTime(timeline.getTime() + playStep);
                moveTimelineIntoTheBounds();
            }
        }
    }, playStep);
}

// Note: this can be any other player: audio, video, svg and etc.
// In this case you have to synchronize events of the component and player.
initPlayer();
showActivePositionInformation();
window.onresize = showActivePositionInformation;


function togglePlayPause() {

    if (playing) {
        onPauseClick();
    } else {
        onPlayClick();
    }
}

document.body.addEventListener('keydown', function (event) {
    if (event.code === 'Space') {
        togglePlayPause();
    }
});