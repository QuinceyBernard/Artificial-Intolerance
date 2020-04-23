const video = document.getElementById('video');
const source = document.getElementById('source');
var genderID;
var ageID;
var documentaryAge;
var documentaryGender;
var documentaryRunning = 0;   //a variable set to either 0 or 1 denoting whether or not the video is currently running on the page
var constraints = { audio: true, video: true};    //these constraints are used to ensure that the issue of deprecated getUserMedia aren't an issue when running in specific browsers
var videoID = ['402232425','402209255', '402210978', '402199002', '401422787', '402231019'];  //an array containing the different vimeo ID's for each subset video
var vimeoID;
var cuetime = 110;    //global variable for the cue time set to 110 seconds
var canvas;   //global variable for canvas and displaySize as these need to called within myInterval function
var displaySize;
var myInterval;


Promise.all([
  faceapi.nets.tinyFaceDetector.loadFromUri('./models'),  //here we are loading in the different models that I require for the face recognition
  faceapi.nets.faceLandmark68Net.loadFromUri('./models'), //the first three are specifically used for finding and highlighting the face, landmarks were used in testing to help understand when a face was detected by the camera
  faceapi.nets.faceRecognitionNet.loadFromUri('./models'),
  faceapi.nets.faceExpressionNet.loadFromUri('./models'),   //expression analysis model allowing me to generate a predicted emotion of the viewer upon watching the documentary video
  faceapi.nets.ageGenderNet.loadFromUri('./models')     //the key aspect of the project is the gender and age analysis, this is done through the AgeGenderNet model which is built on several different databases such as UTKFace
]).then(startVideo)   //once the models are loaded we then run the start video function


function startVideo() {
  navigator.mediaDevices.getUserMedia(constraints)    //sourced from https://stackoverflow.com/questions/59235207/navigator-getusermedia-deprecated-how-to-change-to-mediadevices-getusermedia
  .then(function(mediaStream){  //we want to pull in the webcam stream and assign it to the div set up in the html
    var video = document.querySelector('video');
    video.srcObject = mediaStream;
    video.onloadedmetadata = function(e){
      video.play();
    };
  })
  .catch(function(err){console.log(err.name + ":" + err.message);}); //
}

function generationGender(genders){
  if(genders === "male"){ //whether or not the viewer is detected as male or female will give us a different ID
    var genderID = 0;
  } if (genders === "female"){
    var genderID = 1;
  }
  return genderID; //at the end of the function we want to return what the genderID is for the viewer
}


function generationAge(age){
  if(age<=36){
    var ageID = 0;  //the numbers for ID were chosen specifically so that they could work correctly with the array and the different parameters of age and gender
  } else if(age<=50){
    var ageID = 2
  } else {
    var ageID = 4
  }
  return ageID; //at the end of the function we want to return what the ageID is for the viewer
}


function documentarySelection(genders, age, emotions){
   documentaryGender = generationGender(genders); //here we are generating the gender and age identification numbers
   documentaryAge = generationAge(age);
   classificationID = documentaryGender + documentaryAge; //these numbers are added together to give us the final video id
   vimeoID = videoID[classificationID]; //the final id is run through the videoID array to give us the specific vimeo ID

		var myOptions = {
			 id: vimeoID,  //for the id of the video we set it to vimeoID which is a global variable, that is generated from the age and gender of the viewer
			 width: 640, //defining the size parameters for the video
			 height: 468,
			 autoplay: true, //the video will autoplay once loaded
			controls: false
		   };


		video01Player= new Vimeo.Player('myVideo',myOptions); //setting up my video player to be created within the myVideo element and to use the options defined earlier

  	video01Player.on('play',function(){  //when the video player has started and autoplayed the video do the following function
       documentaryRunning = 1;  //set documentary running to true
       document.getElementById("loader").style.display = "none";  //give the loader a style of none to remove it completely from the page
       clearInterval(myInterval); //clear the interval set at the myInterval function of 1 second
     });


   video01Player.on('ended', function(){  //when the video player has stopped do the following function
     video01Player.destroy().then(function(){ //destroy the video player completely
       documentaryRunning = 0;  //set the documentary running to false
       document.getElementById("loader").style.display = "unset"; //unset any display styles that were previously attributed to the loader
       document.getElementById("streamage").innerHTML= "";  //clear both the streamage and streamgender elements for a fresh restart
       document.getElementById("streamgender").innerHTML = "";
     });
     myInterval();  //run the myInterval function
   });

   video01Player.addCuePoint(cuetime,{ //adds a cue point into the video from the global variable cue time that is measured in seconds
     customKey: 'customValue'
   }).then(function(id){

   }).catch(function(error){
     switch(error.name){
       case 'UnsupportedError': //sourced from : https://developer.vimeo.com/player/sdk/reference

       break;

       case 'RangeError':

       break;

       default:

        break;
     }
   });

   video01Player.on('cuepoint',function(){    //from the cuepoint defined earlier, once reached the following will run
     document.getElementById("streamage").innerHTML = "You are " + age + " years old";  //the variables age, gender and emotion will be put within the relevant elements to display on screen
     document.getElementById("streamgender").innerHTML = "You are " + emotions + " " + genders ;
   });
}


video.addEventListener('play', () => {    //when the webcam has started being streamed to the screen the following code will run
 canvas = faceapi.createCanvasFromMedia(video) //creating a canvas from the media generated from the webcam stream
  document.body.append(canvas)
  displaySize = { width: video.width, height: video.height } //setting the displaysize to that of the video width and height
  faceapi.matchDimensions(canvas, displaySize) //so that the webcam image will align with the canvas we create properly
  function myinterval (){
    setInterval(async () => {
    const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks().withFaceExpressions().withAgeAndGender() //here we are detecting all the faces within the webcam frame, that is passed through the video element and using face api detector along with the models for the faces detected
    const resizedDetections = faceapi.resizeResults(detections, displaySize) //allows us to ensure the detection are redrawn properly over the webcam stream
    canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height) //clearing the canvas of anything that may have been drawn over it by the face api detections
    resizedDetections.forEach(detection => {
      var genders = detections[0].gender; //variable that takes the gender from the detections given by faceapi of the individual within frame
      var age = Math.round(detections[0].age);  // variable that takes the age of the viewer, which is rounded to an integer
      console.log(detections[0].expressions);
      var emotionID = [   //an array that lists the emotion label as well as the value listed within the detections
        {label: "a happy",  // a happy so that the grammar of the sentence displayed on the screen is accurate
          value: detections[0].expressions.happy},
        {label: "a sad",
          value: detections[0].expressions.sad},
        {label: "an angry",
          value: detections[0].expressions.angry},
        {label: "a surprised",
          value: detections[0].expressions.surprised}
        ]

       function compare(a, b) { //sourced from https://www.sitepoint.com/sort-an-array-of-objects-in-javascript/
          if (a.value > b.value) return -1;
          if (b.value > a.value) return 1;
           return 0; }
           emotionID.sort(compare);
        var emotions = emotionID[0].label;

      if (documentaryRunning === 0){  // if the documentary isnt running, the documentary selection function will be run
        documentarySelection(genders, age, emotions);
      }

    })
  }, 1000) // the interval is run at 1 second
}
if (documentaryRunning === 0){  //if documentary isn't running then myInterval function will be called
  myinterval();
}
})
