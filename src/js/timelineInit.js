var outlineContainer = document.getElementById('outline-container');
playing = false;
playStep = 60;

var frameRate = 60;
// Automatic tracking should be turned off when user interaction happened.
trackTimelineMovement = false;
var endFrame = 0;

function generateModel() {
    let rows = [
        {
            title: 'Viseme',
            keyframes: [
            ],
        },
        {
            title: 'Expression',
            keyframes: [
                {
                    val: 0,
                    shape: 'rhomb',
                    type: 'Expression',
                    value: "happy"
                },
            ],
        },
        {
            title: 'HeadLookAt',
            keyframes: [

                {
                    val: 0,
                    shape: 'rhomb',
                    type: 'HeadLookAt',
                    // value: new BABYLON.Vector3(0, 0, 0)
                }


            ],
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

    //     console.log(scene._mainSoundTrack.soundCollection);

    // Iterate through all active sounds and stop each one
    if (scene._mainSoundTrack) {
        for (const sound of scene._mainSoundTrack.soundCollection) {
            sound.stop();
        }
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

timeline.onSelected(function (obj) {
    console.log(obj);

    if (obj.selected[0]) {
        if (obj.selected[0].type && obj.selected[0].type === "Viseme") {
            updateActiveButtonByName(obj.selected[0].value);
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
        // Add keyframe
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

function addKeyframe() {
    if (timeline) {
        // Add keyframe
        const currentModel = timeline.getModel();
        currentModel.rows.push({keyframes: [{val: timeline.getTime()}]});
        timeline.setModel(currentModel);

        // Generate outline list menu
        generateHTMLOutlineListNodes(currentModel.rows);
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