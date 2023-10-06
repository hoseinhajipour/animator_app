const canvas = document.getElementById("renderCanvas"); // Get the canvas element
const engine = new BABYLON.Engine(canvas, true); // Generate the BABYLON 3D engine
var gizmo;
var utilLayer;
var gizmoManager;
var shadowGenerator;
var selectedMesh = null;
var objectNames = [];
var Maincamera;
var frameRate = 60;
var HighlightLayer;
var boundingBoxGizmo;


var load_from_url = null;

const createScene = function (laoadformurl = null) {
    const scene = new BABYLON.Scene(engine);
    Maincamera = new BABYLON.ArcRotateCamera("Camera", 0, 0, 1, new BABYLON.Vector3(0, 0, 0), scene);
    Maincamera.setPosition(new BABYLON.Vector3(0, 1.5, 2));
    Maincamera.minZ = 0.001;
    Maincamera.collisionMask = 1; //check to see if needed
    Maincamera.checkCollisions = true;
    //   Maincamera.wheelPrecision = 0.001;

    Maincamera.setTarget(new BABYLON.Vector3(0, 1.5, 0));
    Maincamera.attachControl(canvas, true);
    this.Maincamera.wheelPrecision = 100;
    // this.Maincamera.zoomToMouseLocation = true;


    const light_0 = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), scene);
    light_0.intensity = 0.7;
    const light = new BABYLON.DirectionalLight("dir01", new BABYLON.Vector3(0, -1, 1), scene);
    light.position = new BABYLON.Vector3(0, 15, -30);
    gizmoManager = new BABYLON.GizmoManager(scene);

    scene.onPointerObservable.add((pointerInfo) => {
        switch (pointerInfo.type) {
            case BABYLON.PointerEventTypes.POINTERDOWN:
                switch (pointerInfo.event.button) {
                    case 0:
                        //   console.log("LEFT");
                        break;
                    case 1:
                        gizmoManager.boundingBoxGizmoEnabled = false;
                        break;
                    case 2:
                        gizmoManager.boundingBoxGizmoEnabled = false;
                        break;
                }
                break;
        }
    });


    shadowGenerator = new BABYLON.ShadowGenerator(2048, light);

    // Skybox

    var box = BABYLON.Mesh.CreateBox('SkyBox', 2048, scene, false, BABYLON.Mesh.BACKSIDE);
    box.material = new BABYLON.SkyMaterial('sky', scene);
    box.backFaceCulling = false;
    box.isPickable = false;
    box.material.inclination = -0.35;
    // Reflection probe
    var rp = new BABYLON.ReflectionProbe('ref', 1024, scene);
    rp.renderList.push(box);

    /*
        var ground = BABYLON.Mesh.CreateGround("ground", 10, 10, 1, scene);

        var gridMaterial = new BABYLON.GridMaterial("gridMaterial", scene);
        gridMaterial.gridRatio = 0.5; // Grid size
        gridMaterial.mainColor = new BABYLON.Color3(1, 1, 1); // Grid color
        gridMaterial.lineColor = new BABYLON.Color3(0, 0, 0); // Line color
        gridMaterial.alpha = 0.5; // Set transparency (0.0 is fully transparent, 1.0 is fully opaque)
        ground.material = gridMaterial;
    */
    /*
        // Create SSAO and configure all properties (for the example)
        var ssaoRatio = {
            ssaoRatio: 0.5, // Ratio of the SSAO post-process, in a lower resolution
            combineRatio: 2 // Ratio of the combine post-process (combines the SSAO and the scene)
        };

        var ssao = new BABYLON.SSAORenderingPipeline("ssao", scene, ssaoRatio);
        ssao.fallOff = 0.000001;
        ssao.area = 1;
        ssao.radius = 0.0001;
        ssao.totalStrength = 1.0;
        ssao.base = 0.5;

        // Attach camera to the SSAO render pipeline
        scene.postProcessRenderPipelineManager.attachCamerasToRenderPipeline("ssao", Maincamera);
    */


    var options = new BABYLON.SceneOptimizerOptions();
    options.addOptimization(new BABYLON.HardwareScalingOptimization(0, 1));

// Optimizer
    var optimizer = new BABYLON.SceneOptimizer(scene, options);


    //  boundingBoxGizmo.isEnabled = false; // Initially, disable the gizmo

    HighlightLayer = new BABYLON.HighlightLayer("hl1", scene, {
        mainTextureRatio: 1,
        mainTextureFixedSize: 2048,
        blurTextureSizeRatio: 1,
        blurVerticalSize: 2,
        blurHorizontalSize: 2,
        threshold: .025,
    });

    return scene;
};


var scene = createScene(); //Call the createScene function
if (load_from_url) {
    BABYLON.SceneLoader.Append("", load_from_url, this.scene, (objectData) => {
        //  console.log(objectData);
        this.Maincamera = objectData.cameras[0];
        this.HighlightLayer = objectData.effectLayers[0];
        updateObjectNamesFromScene();
    });
}

// Register a render loop to repeatedly render the scene
engine.runRenderLoop(function () {
    if (scene) {
        scene.render();
    }
});
// Watch for browser/canvas resize events
window.addEventListener("resize", function () {
    engine.resize();
});
//scene.debugLayer.show();
//scene.debugLayer.show({ embedMode: true });
document.addEventListener("keydown", function (event) {
    // Check the key code and toggle gizmos accordingly

    if (event.key === "f" || event.key === "F") {
        // Get the position of the selected gizmo
        // console.log(selectedMesh)
        if (selectedMesh) {
            var meshPosition = selectedMesh.position;
            Maincamera.target = meshPosition;

            // Move the camera closer to the object
            var distance = 5; // Adjust this value as needed
            var direction = Maincamera.position.subtract(meshPosition).normalize();
            Maincamera.setPosition(meshPosition.add(direction.scale(-distance)));
        }
    }
    if (event.keyCode == 46) {
        selectedMesh.dispose();
        updateObjectNamesFromScene();
    }
    switch (event.key) {
        case "e":
            gizmoManager.positionGizmoEnabled = false;
            gizmoManager.rotationGizmoEnabled = true;
            gizmoManager.scaleGizmoEnabled = false;
            break;
        case "w":
            gizmoManager.positionGizmoEnabled = true;
            gizmoManager.rotationGizmoEnabled = false;
            gizmoManager.scaleGizmoEnabled = false;
            break;
        case "s":
            gizmoManager.positionGizmoEnabled = false;
            gizmoManager.rotationGizmoEnabled = false;
            gizmoManager.scaleGizmoEnabled = true;
            break;
    }
});


canvas.addEventListener("contextmenu", function (event) {
    gizmoManager.positionGizmoEnabled = false;
    gizmoManager.rotationGizmoEnabled = false;
    gizmoManager.scaleGizmoEnabled = false;
    gizmoManager.boundingBoxGizmoEnabled = false;
    event.preventDefault(); // Prevent the default context menu
});


function millisecondsToFrames(milliseconds) {
    var framesPerSecond = 60;
    var seconds = milliseconds / 1000; // Convert milliseconds to seconds
    var frames = seconds * framesPerSecond;
    return frames;
}

function framesToMilliseconds(frames) {
    var framesPerSecond = 60;
    var seconds = frames / framesPerSecond;
    var milliseconds = seconds * 1000; // Convert seconds to milliseconds
    return milliseconds;
}
