const {ipcRenderer} = require('electron');

const fileInput = document.getElementById('lipsync_audio_file');
var MasterAudio = document.getElementById('lipsync_audio');
var inputAudio;
var excludeTargets = [];
var blinkDuration = 5; // Duration of the blink in frames
var blinkWait = 50; // Duration of the blink in frames
fileInput.addEventListener('change', function () {
    const file = event.target.files[0];
    // Get full path
    if (file) {
        inputAudio = file.path;
        const fileURL = URL.createObjectURL(file);
        MasterAudio.src = fileURL;
        $("#runButton").prop("disabled", false);
    }
});


document.getElementById('runButton').addEventListener('click', () => {
    $("#lipsync_loading").show();
    ipcRenderer.send('run-command', inputAudio);
});
ipcRenderer.on('command-done', (event, code, result) => {
    var lipsyncData = JSON.parse(result);
    $("#lipsync_loading").hide();
    ClearVisemeKeyframes();
    lipsyncData.mouthCues.forEach(mouthCue => {
        addVisemeKeyframeByTime(mapViseme(mouthCue.value), secondsToMilliseconds(mouthCue.start));
    });
    lipSync_(lipsyncData.mouthCues, lipsyncData.metadata.duration, HeadMesh, "Head", 0, 1);
    lipSync_(lipsyncData.mouthCues, lipsyncData.metadata.duration, TeethMesh, "Teeth", 0, 2);

});

function mapViseme(phonemeContent) {
    // Define a mapping object that associates phonemes with weights
    var phonemeWeightMapping = {
        'X': 'viseme_sil',
        'A': 'viseme_aa',
        'B': 'viseme_PP',
        'C': 'viseme_CH',
        'D': 'viseme_DD',
        'E': 'viseme_E',
        'F': 'viseme_FF',
        'G': 'viseme_I',
        'H': 'viseme_TH',
    };

    // Check if the phoneme is in the mapping, return default weight if not found
    return phonemeWeightMapping[phonemeContent] || "viseme_sil";
}


function ClearVisemeKeyframes() {
    if (timeline) {
        const currentModel = timeline.getModel();
        // Find the 'Viseme' row in the current model
        const visemeRow = currentModel.rows.find(row => row.title === 'Viseme');
        if (visemeRow) {
            visemeRow.keyframes = [];
        } else {
            currentModel.rows.push({
                title: 'Viseme',
                keyframes: []
            });
        }
        timeline.setModel(currentModel);
    }
}

function addVisemeKeyframeByTime(name, frame_millisecond) {
    if (timeline) {
        const currentModel = timeline.getModel();
        // Find the 'Viseme' row in the current model
        const visemeRow = currentModel.rows.find(row => row.title === 'Viseme');
        var Expressiveness_range = parseInt(document.getElementById("Expressiveness_range").value) / 100;

        // If 'Viseme' row exists, check if a keyframe with the same 'val' property already exists
        if (visemeRow) {
            const existingKeyframeIndex = visemeRow.keyframes.findIndex(keyframe => keyframe.val === timeline.getTime());

            // If a keyframe with the same 'val' property exists, remove it
            if (existingKeyframeIndex !== -1) {
                visemeRow.keyframes.splice(existingKeyframeIndex, 1);
            }

            // Add the new keyframe to 'Viseme' row
            visemeRow.keyframes.push({
                val: frame_millisecond,
                shape: 'rhomb',
                type: 'Viseme',
                value: name,
                expression: Expressiveness_range,
            });
        } else {
            // If 'Viseme' row doesn't exist, create a new one and add the keyframe
            currentModel.rows.push({
                title: 'Viseme',
                keyframes: [
                    {
                        val: frame_millisecond,
                        shape: 'rhomb',
                        type: 'Viseme',
                        value: name,
                        expression: Expressiveness_range,
                    }
                ]
            });
        }
        timeline.setModel(currentModel);


    }
}

function combineKeyFrames(animationGroup, morphVisemeKeys, audio_duration, _HeadMesh) {
    for (var viseme_name in morphVisemeKeys) {
        //  excludeTargets.push(viseme_name);
        var VisemeKeys = morphVisemeKeys[viseme_name];
        var viseme = findMorph(_HeadMesh.morphTargetManager, viseme_name);

        var morphTargetAnimation = new BABYLON.Animation(
            viseme_name,
            "influence",
            frameRate,
            BABYLON.Animation.ANIMATIONTYPE_FLOAT,
            BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE
        );

        var morphTargetKeys = [];
        morphTargetKeys.push({
            frame: 0,
            value: 0.0
        });


        VisemeKeys.forEach(subval => {
            subval.forEach(val => {
                morphTargetKeys.push({
                    frame: val.frame,
                    value: val.value
                });
            });

        });

        var endframe = secondsToFrames(audio_duration, frameRate);
        morphTargetKeys.push({
            frame: endframe,
            value: 0.0
        });

        //  const normalizedKeyframes = normalizeKeyframes(morphTargetKeys);
        morphTargetAnimation.setKeys(morphTargetKeys);
        viseme.animations.push(morphTargetAnimation);
        animationGroup.addTargetedAnimation(morphTargetAnimation, viseme);
    }
}

function resampleAnimation(animation, newFrameRate) {
    // Get the original animation keys
    var keys = animation.getKeys();

    // Calculate the new time interval between keyframes
    var newTimeInterval = 1 / newFrameRate;

    // Create an array to store the resampled keys
    var resampledKeys = [];

    // Iterate through the original keys and resample
    for (var i = 0; i < keys.length - 1; i++) {
        var currentKey = keys[i];
        var nextKey = keys[i + 1];
        var currentTime = currentKey.frame;
        var nextTime = nextKey.frame;

        // Interpolate between the current and next keyframes
        for (var t = currentTime; t < nextTime; t += newTimeInterval) {
            var interpolationFactor = (t - currentTime) / (nextTime - currentTime);
            var interpolatedValue = currentKey.value + (nextKey.value - currentKey.value) * interpolationFactor;

            // Push the resampled key to the array
            resampledKeys.push({
                frame: t,
                value: interpolatedValue,
            });
        }
    }

    // Make sure to add the last keyframe
    resampledKeys.push(keys[keys.length - 1]);

    // Update the animation with the resampled keys
    animation.setKeys(resampledKeys);

    // Return the resampled animation
    return animation;
}

function AllZeroKeyframes(animationGroup, audio_duration, _HeadMesh) {
    // Calculate total frames
    var totalFrames = secondsToFrames(audio_duration, frameRate);


    // Iterate through morph targets
    for (let i = 0; i < _HeadMesh.morphTargetManager.numTargets; i++) {
        const morphTarget = _HeadMesh.morphTargetManager.getTarget(i);

        // Check if the morph target is in the exclusion list
        if (excludeTargets.includes(morphTarget.name)) {
            console.log("exclude : " + morphTarget.name)
            continue; // Skip this morph target
        }

        var morphTargetKeys = [];

        if (morphTarget.animations[0]) {
            var anim = morphTarget.animations[0];

            resampleAnimation(anim, 1);
        } else {
            // Create keyframes for zero influence
            /*
                        for (let j = 0; j < totalFrames; j++) {
                            morphTargetKeys.push({frame: j, value: 0.0});
                        }

                        // Create an animation for the morph target
                        var zeroAnimation = new BABYLON.Animation(
                            morphTarget.name,
                            "influence",
                            frameRate,
                            BABYLON.Animation.ANIMATIONTYPE_FLOAT,
                            BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE
                        );
                        zeroAnimation.setKeys(morphTargetKeys);

                        // Add the animation to the morph target
                        morphTarget.animations.push(zeroAnimation);

                        // Add the animation to the animation group
                        animationGroup.addTargetedAnimation(zeroAnimation, morphTarget);

             */
        }


    }
}

function AutoBlinkAnimate(animationGroup, audio_duration, _HeadMesh) {

    var eyeBlinkLeft = findMorph(_HeadMesh.morphTargetManager, "eyeBlinkLeft");
    var eyeBlinkRight = findMorph(_HeadMesh.morphTargetManager, "eyeBlinkRight");


    var totalFrames = secondsToFrames(audio_duration, frameRate);

    // Calculate the number of complete blink cycles
    var completeCycles = Math.floor(totalFrames / (blinkWait + blinkDuration)) - 1;
    if (completeCycles > 0) {
        // Create an array to store the keyframes for the blink animation
        var morphTargetKeys = [];

        morphTargetKeys.push({
            frame: 0,
            value: 0
        });

        for (var i = 0; i < completeCycles; i++) {

            morphTargetKeys.push({
                frame: blinkWait + (i * blinkWait),
                value: 0
            });
            morphTargetKeys.push({
                frame: blinkWait + (i * blinkWait) + (blinkDuration / 2),
                value: 1.0,
                inTangent : 0,
                outTangent : 0,
            });
            morphTargetKeys.push({
                frame: blinkWait + (i * blinkWait) + blinkDuration,
                value: 0
            });
        }
        morphTargetKeys.push({
            frame: totalFrames,
            value: 0
        });
        // Create animations for both left and right eye blinks
        var eyeBlinkLeftAnimation = new BABYLON.Animation(
            "eyeBlinkLeft",
            "influence",
            frameRate,
            BABYLON.Animation.ANIMATIONTYPE_FLOAT,
            BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE
        );

        var eyeBlinkRightAnimation = new BABYLON.Animation(
            "eyeBlinkRight",
            "influence",
            frameRate,
            BABYLON.Animation.ANIMATIONTYPE_FLOAT,
            BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE
        );

        // Set the keyframes for both animations
        eyeBlinkLeftAnimation.setKeys(morphTargetKeys);
        eyeBlinkRightAnimation.setKeys(morphTargetKeys);


        eyeBlinkLeft.animations.push(eyeBlinkLeftAnimation);
        animationGroup.addTargetedAnimation(eyeBlinkLeftAnimation, eyeBlinkLeft);

        eyeBlinkRight.animations.push(eyeBlinkRightAnimation);
        animationGroup.addTargetedAnimation(eyeBlinkRightAnimation, eyeBlinkRight);
    }


}

function lipSync_(phonemes, audio_duration, _HeadMesh, title, start_frame, order) {

    var Expressiveness_range = document.getElementById("Expressiveness_range");
    if (_HeadMesh) {
        // Ensure that the mesh has a morph target manager
        if (_HeadMesh.morphTargetManager) {
            var morphVisemeKeys = [];
            phonemes.forEach(phoneme => {
                var viseme = findMorph(_HeadMesh.morphTargetManager, mapViseme(phoneme.value));
                if (viseme) {
                    var start = secondsToFrames(phoneme.start);
                    var end = secondsToFrames(phoneme.end);
                    var mid = start + Math.round((end - start) / 2);

                    if (mid === end) {
                        end++;
                    }
                    var morphTargetKeys = [];
                    morphTargetKeys.push({
                        frame: start,
                        value: 0.0
                    });
                    morphTargetKeys.push({
                        frame: mid,
                        value: Expressiveness_range.value / 100
                    });
                    morphTargetKeys.push({
                        frame: end,
                        value: 0.0
                    });

                    if (!morphVisemeKeys[mapViseme(phoneme.value)]) {
                        morphVisemeKeys[mapViseme(phoneme.value)] = [];
                    }
                    morphVisemeKeys[mapViseme(phoneme.value)].push(morphTargetKeys);
                }
            });
            console.log(morphVisemeKeys);


            // Try to find an existing animation group by name
            var existingAnimationGroup = scene.getAnimationGroupByName(_HeadMesh.name + "_talk_" + title);

            // Check if the animation group exists
            if (existingAnimationGroup) {
                // Dispose of the existing animation group
                existingAnimationGroup.dispose();
            }

            // Create a new FaceAnimationGroup
            var FaceAnimationGroup = new BABYLON.AnimationGroup(_HeadMesh.name + "_talk_" + title);

            FaceAnimationGroup.playOrder = order;
            // var FaceAnimationGroup = new BABYLON.AnimationGroup(_HeadMesh.name + "_talk_" + title);
            combineKeyFrames(FaceAnimationGroup, morphVisemeKeys, audio_duration, _HeadMesh);
            //    AutoBlinkAnimate(FaceAnimationGroup, audio_duration, _HeadMesh);
            //   AllZeroKeyframes(FaceAnimationGroup, audio_duration, _HeadMesh);

            //  FaceAnimationGroup.normalize(0, FaceAnimationGroup.to);

            FaceAnimationGroup.offset = start_frame;
            FaceAnimationGroup.blendingSpeed = 0.1;
            FaceAnimationGroup.enableBlending = true;
            FaceAnimationGroup.weight = 1.0;

            updateObjectNamesFromScene();


            BakeApplyAutoblink();

        } else {
            console.error("Morph target manager not found on the mesh.");
        }
    } else {
        console.error("Mesh with name 'Wolf3D_Head' not found.");
    }
}