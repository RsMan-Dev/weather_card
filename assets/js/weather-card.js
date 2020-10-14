function find(selector, parent, all){
    if(all ? all : false){
        if(parent){
            return parent.querySelectorAll(selector) ? parent.querySelectorAll(selector) : null;
        }else{
            return document.querySelectorAll(selector) ? document.querySelectorAll(selector) : null;
        }
    }else{
        if(parent){
            return parent.querySelector(selector) ? parent.querySelector(selector) : null;
        }else{
            return document.querySelector(selector) ? document.querySelector(selector) : null;
        }
    }
}
function createWeatherCard(el, icon_scale, units, lang, gelocalize, pos){
    object = {
        pos: pos !== undefined ? pos : { lat:0 , lon:0 },
        units: units !== undefined ? units : "metric",
        icon_scale: icon_scale !== undefined ? icon_scale : "metric",
        lang: lang !== undefined ? lang === 'fr' ? 'fr' : 'en' : 'en',
        days: lang === 'fr' ? ['dimanche', 'lundi','mardi','mercredi', 'jeudi', 'vendredi', 'samedi'] :
                              [ 'sunday', 'monday','tuesday','wednesday', 'thursday', 'friday', 'saturday'],
        geolocalize: gelocalize !== undefined ? gelocalize : true,
        mainEl: el,
        meteoCardEl: null,

        init: function(){
            self = this;
            this.mainEl.innerHTML = this.getTemplate();
            self.meteoCardEl = find('div.meteo-card', self.mainEl);
            if(this.geolocalize){
                navigator.geolocation.getCurrentPosition(data =>{
                    self.pos.lat = data.coords.latitude;
                    self.pos.lon = data.coords.longitude;
                    self.update();
                    setInterval(function(){ self.update() }, 60000);
                }, data =>{
                    find('h1',self.meteoCardEl).textContent = 'Veuillez autoriser la localisation au navigateur.';
                });
            }
        },

        update: function(){
            self = this;
            fetch(`https://api.openweathermap.org/data/2.5/onecall?lat=${this.pos.lat}&lon=${this.pos.lon}&appid=40c8d83dda5769debb80f7c1561756aa&lang=${this.lang}&units=${this.units}`)
                .then(response => {
                    response.json().then(json => {
                        console.log(json);
                        self.fill(json);
                    });
                });
        },

        fill: function(data){
            self = this;
            let date = new Date(data.current.dt * 1000);
            let weatherNowDiv = find('div.weather-now', this.meteoCardEl);
            find('h1',this.mainEl).textContent = `${this.lang === 'fr' ?  `Temps ce ${this.days[date.getDay()]} à` : `Weather this ${this.days[date.getUTCDay() -1]} at`} ${date.getHours()}:${date.getMinutes() < 10 ? '0'+ date.getMinutes() : date.getMinutes()}`;
            find('div.icon img',weatherNowDiv).src = `http://openweathermap.org/img/wn/${data.current.weather[0].icon}@${this.icon_scale}x.png`;
            find('div.icon img',weatherNowDiv).alt = data.current.weather[0].description;
            find('div.desc div.temp',weatherNowDiv).textContent = `${Math.round(data.current.temp)}°C`;
            find('div.desc div.weather-description',weatherNowDiv).textContent = `${data.current.weather[0].description}`;
            find('div.desc-detailled div.precipitation',weatherNowDiv).textContent = `Pr${lang === 'fr' ? 'é' : 'e'}cipitations: ${Math.round(data.daily[0].pop * 100)}% ${lang === 'fr' ? 'de ' : ''}chances${data.daily[0].rain ? ` ${lang === 'fr' ? 'd\'avoir ' : 'to have '}${Math.round(data.daily[0].rain)} mm ${lang === 'fr' ? 'de pluie' : 'of rain'}` : data.daily[0].snow ?  ` ${lang === 'fr' ? 'd\'avoir ' : 'to have '} ${Math.round(data.daily[0].snow)} mm ${lang === 'fr' ? 'de neige' : 'of snow'}` : ""}`;
            find('div.desc-detailled div.humidity',weatherNowDiv).textContent = `Humidit${lang === 'fr' ? 'é' : 'y'}: ${data.current.humidity}%`;
            find('div.desc-detailled div.wind',weatherNowDiv).textContent = `${lang === 'fr' ? 'Vent' : 'Wind speed'}: ${Math.round(data.current.wind_speed*3.6)} km/h`;

            let hourlyTemp = find('div.hourly', this.meteoCardEl);
            hourlyTemp.innerHTML = '';
            for(let i=0; i<8; i++){
                let date = new Date(data.hourly[i].dt * 1000);
                hourlyTemp.insertAdjacentHTML("beforeend",
                    self.getHourlyCard(date.getHours(), Math.round(data.hourly[i].temp), '°C')
                );
            }
            data.daily.shift();
            let dailyTime = find('div.daily', this.meteoCardEl);
            dailyTime.innerHTML = '';
            data.daily.forEach(function(val, k){
                let date = new Date(val.dt * 1000);
                dailyTime.insertAdjacentHTML('beforeend',
                    self.getDailyCard(
                        date.getDay(),
                        date.toLocaleString().slice(0,2),
                        `http://openweathermap.org/img/wn/${val.weather[0].icon}@${self.icon_scale}x.png`,
                        val.weather[0].description,
                        val.temp.day,
                        val.temp.min,
                        val.temp.max,
                        val.weather[0].description,
                        '°C'
                    )
                );
            });
        },

        getTemplate: function(){
            return `
                <div class="meteo-card">
                    <h1></h1>
                    <div class="weather-now">
                        <div class="icon"><img src="" alt=""></div>
                        <div class="desc">
                            <div class="temp"></div>
                            <div class="weather-description"></div>
                        </div>
                        <div class="desc-detailled">
                            <div class="precipitation"></div>
                            <div class="humidity"></div>
                            <div class="wind"></div>
                        </div>
                    </div>
                    <div class="hourly"></div>
                    <div class="daily"></div>
                </div>
            `;
        },

        getHourlyCard: function(hour, temp, tempUnit){
            return `
                <div class="card">
                    <div class="hour">${hour}:00</div>
                    <div class="temp">${temp}${tempUnit}</div>
                </div>
            `;
        },

        getDailyCard: function(dayOfWeek, dayOfMonth, img_url, img_attr, temp, temp_min, temp_max, desc, tempUnit){
            return `
                <div class="card">
                    <div class="date">${self.days[dayOfWeek].substring(0,3) + '. ' + dayOfMonth}</div>
                    <div class="img"><img src="${img_url}" alt="${img_attr}"></div>
                    <div class="temp">${Math.round(temp)}${tempUnit}</div>
                    <div class="temp-min-max">(${Math.round(temp_min)}-${Math.round(temp_max)}${tempUnit})</div>
                    <div class="desc">${desc}</div>
                </div>
            `;
        },
    };
    object.init()
    return object;
}