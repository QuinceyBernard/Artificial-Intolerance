const video = document.getElementById('video');
const source = document.getElementById('source');
var genderID;
var ageID;
var documentaryAge;
var documentaryGender;
var documentaryRunning = 0;
var constraints = { audio: true, video: true};
var videoID = ['402232425','402209255', '402210978', '402199002', '401422787', '402231019'];
var vimeoID;
var cuetime = 110;
var canvas;
var displaySize;
var video01Player;


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


function documentarySelection(genders, age, emotions){
   documentaryGender = generationGender(genders);
   documentaryAge = generationAge(age);
   classificationID = documentaryGender + documentaryAge;
   vimeoID = videoID[classificationID];

	if(!video01Player){

		var myOptions = {
			 id: vimeoID,
			 width: 640,
			 height: 468,
			 autoplay: true,
			controls: false
		   };


		video01Player= new Vimeo.Player('myVideo',myOptions);

  	video01Player.on('play',function(){
       documentaryRunning = 1;
       document.getElementById("loader").style.display = "none";
       console.log('video started');
     });

	}else{

		video01Player.loadVideo(vimeoID);

	}

   video01Player.on('ended', function(){
     documentaryRunning = 0;
     video01Player.unload()
       console.log('video ended');
       document.getElementById("streamage").innerHTML= "";
       document.getElementById("streamgender").innerHTML = "";
    myinterval();

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
     document.getElementById("streamage").innerHTML = "You are " + age + " years old";
     document.getElementById("streamgender").innerHTML = "You are " + emotions + " " + genders ;
   });
}


video.addEventListener('play', () => {
 canvas = faceapi.createCanvasFromMedia(video)
  document.body.append(canvas)
  displaySize = { width: video.width, height: video.height }
  faceapi.matchDimensions(canvas, displaySize)
  function myinterval (){
    setInterval(async () => {
    const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks().withFaceExpressions().withAgeAndGender()
    const resizedDetections = faceapi.resizeResults(detections, displaySize)
    canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height)
    resizedDetections.forEach(detection => {
      var genders = detections[0].gender;
      var age = Math.round(detections[0].age);

      var emotionID = [
        {label: "a happy",
          value: detections[0].expressions.happy},
        {label: "a sad",
          value: detections[0].expressions.sad},
        {label: "an angry",
          value: detections[0].expressions.angry},
        {label: "a surprised",
          value: detections[0].expressions.surprised}
        ]
          var maxEmo = Math.max.apply(null, emotionID.map(function(item){
            return item.value;
          }))

       function compare(a, b) {
          if (a.value > b.value) return -1;
          if (b.value > a.value) return 1;
           return 0; }
           emotionID.sort(compare);
        var emotions = emotionID[0].label;

      if (documentaryRunning === 0){
		  clearInterval(myinterval);
        documentarySelection(genders, age, emotions);
      }

    })
  }, 1000)
}
myinterval();
})
