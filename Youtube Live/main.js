//------------------------Get Livestream Video------------------------//
// let idArr = [`UCs9_O1tRPMQTHQ-N_L6FU2g`]
// let idObj = {
//   lui: `UCs9_O1tRPMQTHQ-N_L6FU2g`,
//   mag: `UCvzGlP9oQwU--Y0r9id_jnA`,
// }
// fortniteID: UClG8odDC8TS6Zpqk9CGVQiQ
//idMap.set(`lui`, `UCs9_O1tRPMQTHQ-N_L6FU2g`)
//idMap.set(`mag`, `UC7MMNHR-kf9EN1rXiesMTMw`)
//idMap.set(`suba`, `UCvzGlP9oQwU--Y0r9id_jnA`)
//idMap.set(`kiwawa`, `UCHsx4Hqa-1ORjQTh9TYDhww`)
// idMap.set(`???`, `UC060r4zABV18vcahAWR1n7w`)
// idMap.set(`muman`, `UC3n5uGu18FoCy23ggWWp8tA`)

///////////////////////Input your api key
const apiKey = `AIzaSyDolD8QyR72FXSIo-Nc4evywBJXTROic-g`
let idMap = new Map()
let CallStartTime
getLocalStorage()
function setLocalStorage() {
  localStorage.setItem('channelList', JSON.stringify(Object.fromEntries(idMap)));
}
function getLocalStorage() {
  const data = new Map(Object.entries(JSON.parse(localStorage.getItem('channelList'))));
  if (!data) return;
  idMap = data
  // adds the top bar with colume names
}

let allVideoObj = {}
//////////////////////////////////////////////////////////
const formPopup = document.querySelector(".popup")
const overlay = document.querySelector('.overlay')
const formClose = document.querySelector('.form-close')
const formInputID = document.querySelector('.input-id')
const formInputName = document.querySelector('.input-name')
const channelTrackDiv = document.querySelector('.channel-track-div')
const formSubmit = document.querySelector('.form-submit')
let deleteChannel = document.querySelectorAll('.delete-channel')
const liveDiv = document.querySelector('.live-area')
const passDiv = document.querySelector('.passed-area')
//
const upcomingDiv = document.querySelector('.upcoming-area')
// Main page query
const btnAdd = document.querySelector('.btn-add-div')
const btnRefresh = document.querySelector('.btn-refresh')

// eventListener
formClose.addEventListener('click', closeForm)
btnAdd.addEventListener('click', openForm)
btnRefresh.addEventListener('click', reloadMainPage)
//////////////////////////////////////////////////////////

//adding channel to list on start
idMap.forEach(addStart)
function addStart(value, key){
  appendChannel(key, value)
}

//close open form / refreash
function closeForm(e){
    popup.style.display = 'none';
    overlay.style.display = 'none';
}
function openForm(e){
  popup.style.display = 'block';
  overlay.style.display = 'block';
}
function reloadMainPage(){
  CallStartTime = readyToCall(idMap.size)
  idMap.forEach(fetchVid)
}

// form submit
formSubmit.addEventListener('click', submitForm)
function submitForm(){
  const name = document.querySelector('.input-name').value
  const id = document.querySelector('.input-id').value
  appendChannel(name, id)
  formInputName.value = formInputID.value = ''
}
// add channel to form
function appendChannel(name, id){
  let html = `
    <div class="channel-div">
      <p class="channel-name-p" id="channel-name-p">${name}</p>
      <box-icon name='x' class="delete-channel ${'delete'+name}" color="white"></box-icon>
    </div>
  `
  idMap.set(name, id)
  channelTrackDiv.insertAdjacentHTML("beforeend", html)
  document.querySelector(`.${'delete'+name}`).addEventListener('click', clickDelete)
  setLocalStorage()
}
// delete a channel from form
function clickDelete(e){
  const parent = e.target.closest('.channel-div')
  const name = parent.querySelector('.channel-name-p').textContent
  parent.remove()
  idMap.delete(name)
  console.log(idMap);
  setLocalStorage()
}
// function that adds video to the correct div (liv, upcoming, pass)
function appendVideo(title, id, thumbnail, remain, target, passed){
  let startText = `Getting start time`
  if(passed) startText = ''
  if(remain === `Live Now`) target = liveDiv
  let html = `
  <div class="video">
  <a href='https://www.youtube.com/watch?v=${id}' target="_blank"><img class="thumbnail" src='${thumbnail}'/></a>
      <p class="vid-title">${title}</p>
      <p class="vid-remain" id="${id}">${remain}</p>
  </div>
  `
  target.insertAdjacentHTML('beforeend', html)
}


//--------------Function that call the get start time API when all idArr has been returned---------------//
function readyToCall(num){
  const ready = num
  let curr = 0
  return () => {
    curr += 1
    if(ready > curr){
      console.log(`not ready to call API`);
      return
    }
    console.log(`calling start time api`);  
    getStartTime(allVideoObj)
  }
}

//--------------Function that call the Livestream API on click to get video info---------------//

function fetchVid(value){
  fetch(`https://youtube.googleapis.com/youtube/v3/search?part=snippet&channelId=${value}&eventType=upcoming&maxResults=3&order=date&type=video&key=${apiKey}`
  ).then(response => {
    if(!response.ok){
        throw new Error(`${response.status} 403 Ran out of quota`)
    }
    return response.json()
  }).then(data => {
    data.items.forEach((video) => {
      pushVideoInfo(video)
    })
    CallStartTime()
  })
}

//--------------Function that first API call to use to manage the response---------------//
function pushVideoInfo(vObj){
    const snippet = vObj.snippet
    function getVideoInfo(title, videoId, thumbnailURL){
      let newTitle = `${title}`
       if(newTitle.length > 79) newTitle = newTitle.slice(0, 60) + `...`
        return {
            title: newTitle,
            videoId: videoId,
            thumbnailURL: thumbnailURL,
            startTime: 0,
            _dataTimer: 0,
            months: false,
            vidEnd: false
        }
    }

    allVideoObj[vObj.id.videoId] = (getVideoInfo(snippet.title, vObj.id.videoId, snippet.thumbnails.medium.url))
}

//------------------------countdown Timer function------------------------//
function countDownToDate(start) {
    const startDateTime = new Date(start);
    const now = new Date();
    let timeRemaining = startDateTime.getTime() - new Date().getTime();

    const days = Math.floor(timeRemaining / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minute = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
  
    let countdownString = "";
    if(days > 30){
      countdownString += `More than a month away`
    }else if (days > 0) {
      countdownString += `Starts in ${days} day${days > 1 ? "s" : ""} ${hours}hour${days > 1 ? "s" : ""}`;
    }else if(hours > 2){
        countdownString += `Starts in ${hours} hour${hours > 1 ? "s" : ""}`;
    } else if (hours > 0) {
      countdownString += `Starts in ${+hours*60+minute} minute${hours > 1 ? "s" : ""}`;
    } else if(minute > 1){
      countdownString += `Starts in ${minute} minute${minute > 1 ? "s" : ""}`;
    } else {
      countdownString += `Live Now`
    }
  
    return [countdownString, timeRemaining];
  }

//------------------------Get LiveStream Start Time------------------------//
// uses the time to sort, afterwards uses the time as key to access the videoID
let sortObj = {}
let sortArray = []
let stopSort = false
function addTimetoSort(id, time){
  if(!Object.values(sortObj).includes(id)){
    sortObj[time] = id
    sortArray.push(time)
  }
}
//Gets called when all first api call has returned, refer to readyToCall function
function getStartTime(allVidObj){
    let videoIdArr=[]
    for(const obj in allVidObj){
        videoIdArr.push(`id=${allVidObj[obj].videoId}`)
    }
    videoIdArr = videoIdArr.join("&") 
    console.log(videoIdArr);
    fetch(`https://youtube.googleapis.com/youtube/v3/videos?part=liveStreamingDetails&${videoIdArr}&key=${apiKey}`
    ).then(response => {
      if(!response.ok){
          throw new Error(`${errorMsg} ${response.status}`)
      }
      return response.json()
    }).then(data => {
        for(const vid of data.items){
          allVideoObj[vid.id].startTime = vid.liveStreamingDetails.scheduledStartTime
          const start = allVideoObj[vid.id].startTime
          const getFirstTime = countDownToDate(start)
          allVideoObj[vid.id]._dataTimer = getFirstTime[0]
          allVideoObj[vid.id].timeleft = getFirstTime[1]
          addTimetoSort(vid.id, getFirstTime[1])
          //start Clock to update time
          const clock = setInterval(() => {
            for(const key in allVideoObj){
              let dataTimer = allVideoObj[key]._dataTimer
              let timeStart = allVideoObj[key].startTime
              if(allVideoObj[key].vidEnd)continue
              const result = countDownToDate(timeStart)
              let countdownString = result[0];
              const left = result[1]
              console.log(countdownString, left);
              allVideoObj[key]._dataTimer = countdownString
              allVideoObj[key].timeleft = left
            }
            }, 10000);
      }
      console.log(allVideoObj);
    }).then(() => {
      //setTimeout(()=>{startSort()}, 6000)
      startSort()
    })
}

function startSort(){
  sortArray.sort((a,b) => a-b)
  sortArray.forEach(time => {
    let vidID = sortObj[time]
    let video = allVideoObj[vidID]
    let isLive = false
    console.log(`appending 1`);
    appendVideo(video.title, video.videoId, video.thumbnailURL, video._dataTimer, upcomingDiv)
    let liveTrack = setInterval(()=> {
      for(const key in allVideoObj){
        let dataTimer = allVideoObj[key]._dataTimer
        let video = allVideoObj[key]
        if(video.months === true) continue
        if(video.vidEnd)continue
        if(dataTimer === `Live Now`){
          if(!isLive){
            isLive = true
            let deleteVid = document.getElementById(`${video.videoId}`).closest(`.video`)
            upcomingDiv.removeChild(deleteVid)
            if(allVideoObj[video.videoId].timeleft > -20972950){
              console.log(`appending 2`);
              appendVideo(video.title, video.videoId, video.thumbnailURL, video._dataTimer, liveDiv)
              document.getElementById(`${video.videoId}`).textContent = `Live Now`
            }
          }
          if(allVideoObj[video.videoId].timeleft < -20972950 &&  !allVideoObj[video.videoId].vidEnd){
            let targetVid = document.getElementById(`${video.videoId}`).closest('.video');
            targetVid.remove()
            allVideoObj[video.videoId].vidEnd = true
            console.log(`appending 3`);
            appendVideo(video.title, video.videoId, video.thumbnailURL, video._dataTimer, passDiv, true)
            console.log(`clear clock`);
          }
        }else if(dataTimer !== `More than a month away`){
          console.log(`refreashing vid time p text`);
          let vidDiv = document.getElementById(`${key}`)
          console.log(allVideoObj[key]);
          vidDiv.textContent = video._dataTimer
        }else if(video._dataTimer === `More than a month away` && video.months === false){
          video.months = true
          let vidDiv = document.getElementById(`${video.videoId}`)
          vidDiv.textContent = video._dataTimer
        }
      }
    }, 5000)
  })
}