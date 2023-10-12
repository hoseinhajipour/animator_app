function ExportScene() {
    BakeKeyframe();

    const skybox = scene.getMeshByName("SkyBox"); // Replace 'yourSkyboxName' with the actual name of your skybox
    let options = {
        shouldExportNode: function (node) {
            return node !== skybox;
        },
    };
    BABYLON.GLTF2Export.GLBAsync(scene, "fileName", options).then((gltf) => {
        gltf.downloadFiles();
    });
}

function RenderMovie() {
    var maxframe = 0;
    scene.animationGroups.forEach(function (animationGroup) {
        if (maxframe < animationGroup.to) {
            maxframe = animationGroup.to;
        }
    });

    if (BABYLON.VideoRecorder.IsSupported(engine)) {

        var recorderOptions = {
            //  mimeType: 'mp4',
            fps: 60,
            recordChunckSize: 2048,
        };


        var recorder = new BABYLON.VideoRecorder(engine, recorderOptions);
        canvas.requestFullscreen().catch(function (error) {
            console.error("Fullscreen error:", error);
        });

        recorder.startRecording();

        var animationGroups = scene.animationGroups;
        animationGroups.forEach(group => {
            group.stop();
            group.play();
        })

        setTimeout(() => {
            recorder.stopRecording()

            var animationGroups = scene.animationGroups;
            animationGroups.forEach(group => {
                group.stop();
            });

            document.exitFullscreen();
        }, maxframe * frameRate);
    }

}


function getRotationRelativeToTarget(camera) {
    // Get the camera's current position
    var cameraPosition = camera.position.clone();

    // Get the camera's target position
    var targetPosition = camera.getTarget().clone();

    // Calculate the direction vector from the target to the camera
    var direction = cameraPosition.subtract(targetPosition);

    // Calculate the rotation angles (in radians)
    var yaw = Math.atan2(direction.x, direction.z);
    var pitch = Math.atan2(direction.y, Math.sqrt(direction.x * direction.x + direction.z * direction.z));

    // Convert radians to degrees for more user-friendly values
    yaw = BABYLON.Tools.ToDegrees(yaw);
    pitch = BABYLON.Tools.ToDegrees(pitch);

    // Ensure yaw is between 0 and 360 degrees
    if (yaw < 0) {
        yaw += 360;
    }

    // Return the rotation angles
    return {yaw: yaw, pitch: pitch};
}


function ConvertArcRotateCameraToFreeCamera(newName) {

    var newCamera = Maincamera.clone();
    newCamera.name = newName;

    var _quaternion = BABYLON.Quaternion.RotationYawPitchRoll(newCamera.rotation.x, newCamera.rotation.y, newCamera.rotation.x);
    newCamera.rotationQuaternion = _quaternion;
    console.log(newCamera);
}

function AddCamera() {
    var cameraName = prompt("Enter a name for the camera:");
    // Check if the user entered a camera name and it's not empty
    if (cameraName !== null && cameraName.trim() !== "") {
        ConvertArcRotateCameraToFreeCamera(cameraName);

        // Update the scene's object names
        updateObjectNamesFromScene();
    } else {
        // Handle the case where the user canceled the prompt or entered an empty name
        alert("Camera creation canceled or camera name is empty.");
    }
}


function AddCube() {
    var cube = BABYLON.MeshBuilder.CreateBox("Cube " + (scene.meshes.length + 1), {size: 1}, scene);
    cube.position = new BABYLON.Vector3(0, 0, 0);

    gizmoManager.attachToMesh(cube);
    cube.receiveShadows = true;
    shadowGenerator.addShadowCaster(cube, true);
    gizmoManager.positionGizmoEnabled = true;
    gizmoManager.rotationGizmoEnabled = false;
    gizmoManager.scaleGizmoEnabled = false;

    updateObjectNamesFromScene();
}


function ImportModel() {
    // Find the input element by its id
    const modelFileInput = document.getElementById('modelFileInput');
    modelFileInput.click();
}
