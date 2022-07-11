import fetch from 'node-fetch'
import HttpsProxyAgent from 'https-proxy-agent'

const agent = new HttpsProxyAgent('http://bcpxy.nycnet:8080')
const url = 'https://services6.arcgis.com/yG5s3afENB5iO9fj/arcgis/rest/services/COVIDTestingSites_PROD_VIEW/FeatureServer/0/query?f=geojson&cacheHint=true&outFields=*&outSR=4326&spatialRel=esriSpatialRelIntersects&where=1%3D1'
const today = dateString(new Date())

function dateString(date) {
  return new Date(date).toISOString().split('T')[0]
}

function dateClause() {
  if (process.argv[2] === '-D') {
    return ` AND StartDate%20<=%20%27${today}%27%20AND%20EndDate%20>=%20%27${today}%27`
  }
  return ''
}

let closed = 0
fetch(`${url}${dateClause()}`, {agent}).then(response => {
  response.json().then(featureCollection => {
    const features = featureCollection.features
    features.forEach(f => {
      const startDate = dateString(f.properties.StartDate)
      const endDate = dateString(f.properties.EndDate)
      if (today < startDate || today > endDate) {
        closed = closed + 1
        console.warn({
          feature: f.properties,
          startDate,
          endDate,
          today
        })
      }
    })
    console.warn(`${closed} of ${features.length} features out of date range`)
    if (dateClause() === '') 
      console.info(
        `\nNOTE: run this script with the -D option\nto add a date filter to the where clause:\n\nStartDate <= '${today}' AND EndDate >= '${today}'
      `)
  })
})


