// Sound Booster by hemanta gayen
const API = chrome || browser;
const $ = (ele)=> { elemnts = document.querySelectorAll(ele); return elemnts? elemnts.length > 1 ? elemnts : elemnts[0] : null;};
const READY = (callback)=>{document.readyState === "complete" ? callback() : window.addEventListener("load", callback, {once: true})};
const STORAGE = (key)=>{ return new Promise(resolve => { API.storage.local.get([key], (result) => { resolve(result[key]);});});};
const COLOR = async () =>{is_dark = await STORAGE("darkMode");return is_dark == undefined ? "#ff0098" : is_dark ? "#026fff" : "#ff0098";}



class CONTENT {
    constructor() {
        this.maxVolume = 600;
        this.vizualizeContent = null;
    }

    async createHtml(){
      const vizualize = await this.createVizualize();
      const color = await COLOR();
      if (vizualize) {
        const volume = vizualize.querySelector('.volume');
        volume.style.color = color ? color:"#ff0098";
        
        const segments = vizualize.querySelector('.segments');
        if (segments) {
          const ranges = [
            "91-100",
            "81-90",
            "71-80",
            "61-70",
            "51-60",
            "41-50",
            "31-40",
            "21-30",
            "11-21",
            "1-10"
          ];
          for (let i = 0; i < ranges.length; i++) {
            const div = document.createElement("div");
            div.className = "segment";
            div.setAttribute("data-range", ranges[i]);
            div.style.border = color ? `2px solid ${color}` : "2px solid #ff0098";
            segments.appendChild(div);

            const span = document.createElement("span");
            span.style.background = color ? color:"#ff0098";
            div.appendChild(span);
          }
        }
      }
    }

    createVizualize(){
      return new Promise((resolve, reject) =>{
        const visusalizer = document.createElement("div");
        visusalizer.id = "sound_visusalizer";
        
        const sound = document.createElement("div");
        sound.className = "volume"
        sound.textContent = "VOL 600%"
        visusalizer.appendChild(sound);

        const segments = document.createElement("div");
        segments.className = "segments"
        visusalizer.appendChild(segments);

        document.body.appendChild(visusalizer);    
        this.vizualizeContent = visusalizer;
        resolve(this.vizualizeContent);
      })
    }

    receiver(){
      API.runtime.onMessage.addListener(((message, sender, sendResponse) => {
          switch (message.action) {
              case "volumeGain":
                  this.updateVolume(message.volume)
          }
      }))
    }

    hideVisualizer() {
      this.fadeTimeout = setTimeout((() => {
         this.fadeInterval = setInterval((() => {
            this.vizualizeContent.style.opacity || (fadeTarget.style.opacity = 1),
            0 < this.vizualizeContent.style.opacity ? this.vizualizeContent.style.opacity -= .01 : 
            (this.vizualizeContent.style.display="none", clearInterval(this.fadeInterval))
         }),10);
      }),800);
    }

    updateSegments(number){
      if (this.vizualizeContent) {
        const val = parseInt(100 * number / this.maxVolume);
        const volume = this.vizualizeContent.querySelector('.volume');
        volume ? volume.textContent =  number > 1 ? `VOL ${number}%` : "MUTE" : null ;
        const segments = this.vizualizeContent.querySelectorAll('.segment');
        if (segments) {
          segments.forEach(function(element) {
            const span = element.querySelector("span");
            if (span) {
              const range = element.dataset.range;
              const down_range = +range.split("-")[0];
              const up_range = +range.split("-")[1];
              val > up_range ? span.style.width = "100%" : 
              val >= down_range && val <= up_range ?
              span.style.width = (100 - 100 * (up_range - val) / 20 + "%") : 
              span.style.width = "0%"
            }
          });
        }
      }
    }

    updateVolume(val) {
      const number = + val;
      if (Number.isInteger(number)) {
        if (this.vizualizeContent) {
            this.vizualizeContent.style.display = "block";
            this.vizualizeContent.style.opacity = "1";
            this.updateSegments(number);
            clearInterval(this.fadeInterval);
            clearTimeout(this.fadeTimeout);
            this.hideVisualizer();
        }

      }

    }

    start(){
        this.receiver();
        this.createHtml();
    }











}




READY(() => {
    try{
        const content = new CONTENT;
        content.start();
    }catch(err) {
        console.log(err.message);
    }
});