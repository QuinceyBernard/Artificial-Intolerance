const video = document.getElementById('video');
const source = document.getElementById('source');
var genderID;
var ageID;
var documentaryAge;
var documentaryGender;
var documentaryRunning = 0;
var constraints = { audio: true, video: true};
var vidid = ['402232425','402209255', '402210978', '402199002', '401422787', '402231019'];
var vimeoID;
var cuetime = 110;



Promise.all([
  faceapi.nets.tinyFaceDetector.loadFromUri('./models'),
  faceapi.nets.faceLandmark68Net.loadFromUri('./models'),
  faceapi.nets.faceRecognitionNet.loadFromUri('./models'),
  faceapi.nets.faceExpressionNet.loadFromUri('./models'),
  faceapi.nets.ageGenderNet.loadFromUri('./models')
]).then(startVideo)



function startVideo() {
  navigator.mediaDevices.getUserMedia(constraints)
  .then(function(mediaStream){
    var video = document.querySelector('video');
    video.srcObject = mediaStream;
    video.onloadedmetadata = function(e){
      video.play();
    };
  })
  .catch(function(err){console.log(err.name + ":" + err.message);});
}

function generationGender(genders){
  if(genders === "male"){
    var genderID = 0;
  } if (genders === "female"){
    var genderID = 1;
  }
  return genderID;
}


function generationAge(age){
  if(age<=36){
    var ageID = 0;
  } else if(age<=50){
    var ageID = 2
  } else {
    var ageID = 4
  }
  return ageID;
}


function documentarySelection(genders, age){
   documentaryGender = generationGender(genders);
   documentaryAge = generationAge(age);
   classificationID = documentaryGender + documentaryAge;
   // console.log("running documentarySelection");
   vimeoID = vidid[classificationID];
   // console.log(age)


   var myOptions = {
     id: vimeoID,
     width: 640,
     height: 468,
     autoplay: true,
     controls: false
   };

   // console.log(vimeoID);

   var video01Player= new Vimeo.Player('myVideo',myOptions);

   // video01Player.play();

   video01Player.on('play',function(){
     documentaryRunning = 1;
     console.log('video started');
   });

   video01Player.on('ended', function(){
     documentaryRunning = 0;
     video01Player.unload()
       console.log('video unloaded')
       console.log('video ended');
   });

   video01Player.addCuePoint(cuetime,{
     customKey: 'customValue'
   }).then(function(id){

   }).catch(function(error){
     switch(error.name){
       case 'UnsupportedError':

       break;

       case 'RangeError':

       break;

       default:

        break;
     }
   });

   video01Player.on('cuepoint',function(){
     console.log('hello male millenial');
     document.getElementById("streamage").innerHTML = "You are " + age + " years old";
     document.getElementById("streamgender").innerHTML = "You are a " + genders ;

   });

}


// listen for webcam image to run then recognise
video.addEventListener('play', () => {
  const canvas = faceapi.createCanvasFromMedia(video)
  document.body.append(canvas)
  const displaySize = { width: video.width, height: video.height }
  faceapi.matchDimensions(canvas, displaySize)
  setInterval(async () => {
    console.log("interval running");
    const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks().withFaceExpressions().withAgeAndGender()
    const resizedDetections = faceapi.resizeResults(detections, displaySize)
    canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height)
    resizedDetections.forEach(detection => {
      var genders = detections[0].gender;
      var age = Math.round(detections[0].age);
      if (documentaryRunning === 0){
        documentarySelection(genders, age);
      }

    })
  }, 1000)
})
