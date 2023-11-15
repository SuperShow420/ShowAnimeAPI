const express = require('express')
const port = 80
const cors = require('cors')
const app = express()
const cheerio = require('cheerio');
const mongoose = require("mongoose")

var stringSimilarity = require('string-similarity')
const Anime = require('./ShowAnimeData.js')

mongoose.connect("mongodb+srv://supershow420:UQzGbfR9MMn5Sdx3@cluster2151.ogv0pdi.mongodb.net/?retryWrites=true&w=majority", 
        
    {
        useNewUrlParser : true,
        useUnifiedTopology : true
    }

)
        
var db = mongoose.connection

db.on('error', console.error.bind(console, 'connection error'))

db.once('open', function() {
    console.log("connected to database")
})

const epSchema = new mongoose.Schema({
    episodeNum : Number,
    link : Object
});

const data = mongoose.model('downloadlink', {
    saId : Number,
    malId : Number,
    animeName : String,
    engSub : [epSchema],
    engDub : [epSchema]
})

app.listen(port, () => {
    console.log("listening on port 80", stringSimilarity.compareTwoStrings("bleach", "blach")                                  )
})

app.use(cors());

import('node-fetch').then((module) => {
    const fetch = module.default;
    app.get('/mal/:id', async (req, res) => {
      try {
        const url = `https://myanimelist.net/anime/${req.params.id}`;
        const response = await fetch(url);
        const htmlContent = await response.text();
        const $ = cheerio.load(htmlContent);
        const url_ = `https://myanimelist.net/anime/${req.params.id}/episode`;
        const response_ = await fetch(url_);
        const htmlContent_ = await response_.text();
        const $_ = cheerio.load(htmlContent_);

        console.log($_('.di-ib.pl4.fw-n.fs10').text(), $('.title-name.h1_bold_none').text())

        const title = $('.title-name.h1_bold_none').text();
        const description = $('[itemprop="description"]').text()
        const spaceIt = $('.spaceit_pad').text()
        const animeInfo = spaceIt.split("\n")
        const episodes = (animeInfo[animeInfo.findIndex((anime) => {
            return anime.toLowerCase().trim().startsWith("episode");
        }) + 1]).trim()
        const type = (animeInfo[animeInfo.findIndex((anime) => {
            return anime.toLowerCase().trim().startsWith("type");
        }) + 1]).trim()
        const status = (animeInfo[animeInfo.findIndex((anime) => {
            return anime.toLowerCase().trim().startsWith("status");
        }) + 1]).trimStart()
        const aired = (animeInfo[animeInfo.findIndex((anime) => {
            return anime.toLowerCase().trim().startsWith("aired");
        }) + 1]).trimStart()

        let genre = []

        genreIndex = (animeInfo[animeInfo.findIndex((anime) => {
            return anime.toLowerCase().trim().startsWith("genre");
        }) + 1]).split(",")
        
        for (let i = 0; i < genreIndex.length; i++) {
            
            genre.push((genreIndex[i].trim()).slice(0, (genreIndex[i].trim()).length/2))
            
        }

        const duration = (animeInfo[animeInfo.findIndex((anime) => {
            return anime.toLowerCase().trim().startsWith("duration");
        }) + 1]).trimStart()

        var otherNames = []

        let spaceit = $('.spaceit_pad')
        
        for (let i = 0; i < spaceit.length; i++) {
            
            if (spaceit.eq(i).find('.dark_text').text() == "Type:") {
                
                for (let index = 0; index < i; index++) {
                    
                    otherNames.push(spaceit.eq(index).contents().last().text().trim())
                    
                }
                
            }
            
        }

        otherNames.push(title)

        console.log(otherNames)
        
        
        
        
        console.log({
            'title' : title,
            "otherNames" : otherNames,
            'description' : description,
            'episodes' : episodes,
            'type' : type,
            'status' : status,
            'aired' : aired,
            'genre' : genre,
            'duration' : duration
        })
        res.send({
            'title' : title,
            "otherNames" : otherNames,
            'description' : description,
            'episodes' : episodes,
            'type' : type,
            'status' : status,
            'aired' : aired,
            'genre' : genre,
            'duration' : duration,
        });
      } catch (error) {
        console.error('Fetch error:', error);
        res.status(500).send('Internal Server Error');
      }
    });
  });

app.post('/link/:malId', (req, res) => {
console.log(req.body)
    data.findOne({malId : req.params.malId})
        .then(dataExists => {
            if (dataExists) {

                const data_ = {
                    episodeNum : req.body.epNum,
                    link : req.body.link
                }
                
                if (req.body.lang == "engSub") {
                    dataExists.engSub.push(data_)
                    dataExists.save()
                    .then(savedVideoDetails => {
                        res.status(200).send(savedVideoDetails)
                        console.log(savedVideoDetails, "data saved")
                    })
                    .catch(err => {
                        console.error(err, "Error while saving video details")
                    })
                }
                if (req.body.lang == "engDub") {
                    dataExists.engSub.push(data_)
                    dataExists.save()
                    .then(savedVideoDetails => {
                        console.log(savedVideoDetails, "data saved")
                    })
                    .catch(err => {
                        console.error(err, "Error while saving video details")
                    })
                }

        
            } else {
                console.log("anime does not exist")
            }
        })

})

app.post('/getlink', async (req, res) => {
    console.log(req.body, req.body.url)
    try {
        console.log(req.body, req.body.url);

        let headersList = {
            "Accept": "*/*",
            "User-Agent": "Thunder Client (https://www.thunderclient.com)"
        };

        let response = await fetch(req.body.url, {
            method: "GET",
            headers: headersList
        });

        let data = await response.text();

        const $ = cheerio.load(data);
        const aElement = $('div.favorites_book li.dowloads a').first();

        console.log(aElement.attr('href'));
        res.json(aElement.attr('href'));
    } catch (error) {
        console.error('Error fetching data:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }

})

app.post('/add-downlod-link-object/:id', (req, res) => {
    data.findOne({malId : req.params.id})
        .then(dataExists => {
            
            if (dataExists) {

                console.log("data exists")
                res.send("data already exists")
        
            } else {
                const data_ = new data({
                    malId : req.params.id,
                    animeName : req.body.title
                })
                data_.save()
                .then(savedVideoDetails => {
                    console.log(savedVideoDetails, "data saved")
                    res.send("data saved")
                })
                .catch(err => {
                    console.error(err, "Error while saving video details")
                    res.send("error")
                })
            }
            
        })
})

app.get('/anime-details-all/:id', (req, res) => {

    const animeInfo = Anime.filter((anime) => {
        return anime.animeName.toLocaleLowerCase() == req.params.id.toLocaleLowerCase() || anime.mal_aniID == req.params.id
    })

    if (animeInfo[0]) {
        
        res.status(200).send({
            'anime' : animeInfo
        })

    } else {
        res.status(200).send({
            "anime" : "Anime not found"
        })
    }

    
    console.log(req.params.id)

})

app.get('/anime-details/:id', (req, res) => {

    const animeInfo = Anime.filter((anime) => {
        return anime.animeName.toLocaleLowerCase() == req.params.id.toLocaleLowerCase() || anime.mal_aniID == req.params.id
    })

    delete animeInfo[0].serverSub
    delete animeInfo[0].serverDub

    
    if (animeInfo[0]) {
        
        res.status(200).send({
            'anime' : animeInfo
        })

    } else {
        res.status(200).send({
            "anime" : "Anime not found"
        })
    }

    
    console.log(req.params.id)

})

app.get('/watch/:id/:lang/:episode', (req, res) => {

    const animeInfo = Anime.filter((anime) => {
        return anime.animeName.toLocaleLowerCase() == req.params.id.toLocaleLowerCase() || anime.mal_aniID == req.params.id
    })

    
    if (animeInfo[0]) {
        
        if (req.params.lang == "eng-sub"|| req.params.lang == "eng-dub") {
         
            if (req.params.lang == "eng-sub") {
                
                if (animeInfo[0].serverSub.streamsb[req.params.episode - 1]) {
                    
                    res.status(200).send({
                        'anime' : animeInfo[0].serverSub.streamsb[req.params.episode - 1]
                    })
    
                } else {
    
                    res.status(200).send({
                        "anime" : "Anime episode not found"
                    })
                    
                }
    
            } else {
    
                if (animeInfo[0].serverDub.streamsb[req.params.episode - 1]) {
                    
                    res.status(200).send({
                        'anime' : animeInfo[0].serverDub.streamsb[req.params.episode - 1]
                    })
    
                } else {
    
                    res.status(200).send({
                        "anime" : "Anime episode not found"
                    })
                    
                }
                
            }
            
        } else {

            res.status(200).send({
                "anime" : animeInfo[0].animeName + " is not available in " + req.params.lang
            })
         
        }

    } else {

        res.status(200).send({
            "anime" : "Anime not found"
        })

    }

    
    console.log(req.params.id, req.params.episode)

})

app.get('/search/:id', (req, res) => {

    if (req.params.id.length > 0) {
        
        var animeInfo = Anime.filter((Name) => {

            if (Name.otherNames[4]) {

                for (let i = 0; i < 5; i++) {
                    
                    let a = stringSimilarity.compareTwoStrings(Name.otherNames[i].toLocaleLowerCase(), req.params.id.toLocaleLowerCase())
                    
                    if (a > 0.56 || Name.otherNames[i].toLocaleLowerCase().startsWith(req.params.id.toLocaleLowerCase())) {

                        i = 5
                        return a

                    }
                    
                }
                
            }

            if (Name.otherNames[3]) {
    
                
                for (let i = 0; i < 4; i++) {
                    
                    let a = stringSimilarity.compareTwoStrings(Name.otherNames[i].toLocaleLowerCase(), req.params.id.toLocaleLowerCase())
                    
                    if (a > 0.56 || Name.otherNames[i].toLocaleLowerCase().startsWith(req.params.id.toLocaleLowerCase())) {

                        i = 5
                        return a

                    }
                    
                }
                
            }

            if (Name.otherNames[2]) {
    
                
                for (let i = 0; i < 3; i++) {
                    
                    let a = stringSimilarity.compareTwoStrings(Name.otherNames[i].toLocaleLowerCase(), req.params.id.toLocaleLowerCase())
                    
                    if (a > 0.56 || Name.otherNames[i].toLocaleLowerCase().startsWith(req.params.id.toLocaleLowerCase())) {

                        i = 5
                        return a

                    }
                    
                }
                
            }
            if (Name.otherNames[1]) {
    
                
                for (let i = 0; i < 2; i++) {
                    
                    let a = stringSimilarity.compareTwoStrings(Name.otherNames[i].toLocaleLowerCase(), req.params.id.toLocaleLowerCase())
                    
                    if (a > 0.56 || Name.otherNames[i].toLocaleLowerCase().startsWith(req.params.id.toLocaleLowerCase())) {

                        i = 5
                        return a

                    }
                    
                }
                
            }
            if (Name.otherNames[0]) {
            
                
                for (let i = 0; i < 1; i++) {
                    
                    let a = stringSimilarity.compareTwoStrings(Name.otherNames[i].toLocaleLowerCase(), req.params.id.toLocaleLowerCase())
                    
                    if (a > 0.56 || Name.otherNames[i].toLocaleLowerCase().startsWith(req.params.id.toLocaleLowerCase())) {

                        i = 5
                        return a

                    }
                    
                }
                
            }
            
            
        })
    
        animeInfo = animeInfo.sort((a, b) => {
                    return a.animeName.localeCompare(b.animeName)
                })
                
    }            

    if (animeInfo[0]) {
        
        res.status(200).send({
            'anime' : animeInfo
        })

    } else {

        res.status(200).send({
            "anime" : "Anime not found"
        })

    }

    
    console.log(req.params.id)

})
