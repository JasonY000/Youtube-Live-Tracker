//!!!!!!!!!!!!!!!!!!!!!!!Input your api key!!!!!!!!!!!!!!!!!!!!!!!!!!!!!//
//const apiKey = `Your API Key`
let idMap = new Map()
let CallStartTime
getLocalStorage()
let allVideoObj = {}
function setLocalStorage() {
  localStorage.setItem('channelList', JSON.stringify(Object.fromEntries(idMap)));
}
function getLocalStorage() {
  if(localStorage.getItem('channelList') === null)return
  const data = new Map(Object.entries(JSON.parse(localStorage.getItem('channelList'))));
  if (!data) return;
  idMap = data
}
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
const lookupInput = document.querySelector('.input-lookup')
const lookupSubmit = document.querySelector('.lookup-submit')
const searchDiv = document.querySelector('.search-div')
const clearSearch = document.querySelector('.lookup-clear')
//
const upcomingDiv = document.querySelector('.upcoming-area')
// Main page query
const btnAdd = document.querySelector('.btn-add-div')
const btnRefresh = document.querySelector('.btn-refresh')

// eventListener
formClose.addEventListener('click', closeForm)
btnAdd.addEventListener('click', openForm)
btnRefresh.addEventListener('click', reloadMainPage)
formSubmit.addEventListener('click', submitForm)
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
  console.log(idMap);
}
// btn that starts the api call
function reloadMainPage(){
  CallStartTime = readyToCall(idMap.size)
  idMap.forEach(fetchVid)
}
// clear lookup
clearSearch.addEventListener('click', searchClear)
function searchClear(){
  searchDiv.innerHTML =""
  lookupInput.value =''
}
//channel Lookup
lookupSubmit.addEventListener('click', lookupAPI)
function lookupAPI(){
  const name = lookupInput.value
  lookupInput.value = ''
  fetch(`https://youtube.googleapis.com/youtube/v3/search?part=snippet&channelType=any&eventType=none&maxResults=5&q=${name}&key=${apiKey}`)
  .then(response => {
    if(!response.ok){
        throw new Error(`${response.status} 403 Ran out of quota`)
    }
    return response.json()
  }).then(data => {
    const channels = manageLookup(data)
    for(const [key,value] of Object.entries(channels)){
      searchDiv.insertAdjacentHTML("beforeend", `
      <div class="channel-div">
        <p class="channel-name-p" id="channel-name-p">${key}</p>
        <a href='https://www.youtube.com/channel/${value}' target="_blank" class='${key} view'id='${value}'>View Channel</a>
        <button class="search-add" id='${'btn'+key}'>add</button>
      </div>
      `)
      const button = document.getElementById(`${'btn'+key}`)
      button.addEventListener('click', addFromSearch)
    }
  })
}
function manageLookup(data){
  let infoArray = data.items
  let managed = {}
  for(const obj of infoArray){
    managed[obj.snippet.channelTitle] = obj.snippet.channelId
  }
  return managed
}
function addFromSearch(e){
  const parent = e.target.closest('.channel-div')
  const aTag = parent.querySelector(`a:first-of-type`)
  const id = aTag.id
  const name = aTag.className
  appendChannel(name,id)
}
// form submit
function submitForm(){
  const name = document.querySelector('.input-name').value
  const id = document.querySelector('.input-id').value
  appendChannel(name, id)
  formInputName.value = formInputID.value = ''
}
// add channel to form
function appendChannel(name, id){
  const newName = name.match(/[a-z]+/gmi).join('')
  let html = `
    <div class="channel-div">
      <p class="channel-name-p" id="channel-name-p">${newName}</p>
      <box-icon name='x' class="delete-channel ${'delete'+newName}" color="white"></box-icon>
    </div>
  `
  idMap.set(newName, id)
  channelTrackDiv.insertAdjacentHTML("beforeend", html)
  document.querySelector(`.${'delete'+newName}`).addEventListener('click', clickDelete)
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
    console.log(allVideoObj);
    getStartTime(allVideoObj)
  }
}

//--------------Function that call the Livestream API on click to get video info---------------//

function fetchVid(value){
  console.log(value);
  fetch(`https://youtube.googleapis.com/youtube/v3/search?part=snippet&channelId=${value}&eventType=upcoming&maxResults=3&order=date&type=video&key=${apiKey}`
  ).then(response => {
    if(!response.ok){
        throw new Error(`${response.status} 403 Ran out of quota`)
    }
    return response.json()
  }).then(data => {
    console.log(data);
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
            vidEnd: false,
            beenLive: false
        }
    }
    console.log(getVideoInfo(snippet.title, vObj.id.videoId, snippet.thumbnails.medium.url));
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
    console.log(timeRemaining);
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
    console.log(videoIdArr);
    videoIdArr = videoIdArr.join("&") 
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
        }
        const clock = setInterval(() => {
          for(const key in allVideoObj){
            let timeStart = allVideoObj[key].startTime
            if(allVideoObj[key].vidEnd)continue
            const result = countDownToDate(timeStart)
            let countdownString = result[0];
            const left = result[1]
            console.log(countdownString);
            allVideoObj[key]._dataTimer = countdownString
            allVideoObj[key].timeleft = left
          }
          }, 10000);
      console.log(allVideoObj);
    }).then(() => {
      startSort()
    })
}

function startSort(){
  sortArray.sort((a,b) => a-b)
  sortArray.forEach(time => {
    let vidID = sortObj[time]
    let video = allVideoObj[vidID]
    let isLive = false
    appendVideo(video.title, video.videoId, video.thumbnailURL, video._dataTimer, upcomingDiv)
  })
    let liveTrack = setInterval(()=> {
      console.log(`new logs`);
      for(const key in allVideoObj){
        let dataTimer = allVideoObj[key]._dataTimer
        let video = allVideoObj[key]
        if(video.months === true) continue
        if(video.vidEnd)continue
        if(dataTimer === `Live Now`){
          if(!video.beenLive){
            video.beenLive = true
            let deleteVid = document.getElementById(`${video.videoId}`).closest(`.video`)
            upcomingDiv.removeChild(deleteVid)
            if(allVideoObj[video.videoId].timeleft > -10972950){
              appendVideo(video.title, video.videoId, video.thumbnailURL, video._dataTimer, liveDiv)
              document.getElementById(`${video.videoId}`).textContent = `Live Now`
            }
          }
          // if stream have been live for more than 5 hours
          if(allVideoObj[video.videoId].timeleft < -10972950 &&  !allVideoObj[video.videoId].vidEnd){
            let targetVid = document.getElementById(`${video.videoId}`).closest('.video');
            targetVid.remove()
            allVideoObj[video.videoId].vidEnd = true
            appendVideo(video.title, video.videoId, video.thumbnailURL, video._dataTimer, passDiv, true)
          }
        }else if(dataTimer !== `More than a month away`){
          console.log(`refreashing vid time p text`);
          let vidDiv = document.getElementById(`${key}`)
          vidDiv.textContent = video._dataTimer
        }else if(video._dataTimer === `More than a month away` && video.months === false){
          video.months = true
          let vidDiv = document.getElementById(`${video.videoId}`)
          vidDiv.textContent = video._dataTimer
        }
      }
    }, 10000)
}
