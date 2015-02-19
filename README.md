# Umbraco Google maps routeplanner property editor
==================================================

Routeplanner property editor for Umbraco backoffice
The property editor will enable you to draw a route in the Umbraco backoffice, and later on get it rendered on one of your pages.
The editor tries to be as flexible as possible, to enable as many possibilities as possible.
Loading the google map has been inspired from the many Google Maps modules for the Umbraco Backoffice, and the functionality was inspired by a running site i used to utilize.

The editor was developed as a routeplanner for running. This means that you could go draw you route, and get the length of it. Later on you could input the duration of the run, and render it on your website. Its great for looking back at how you preformed earlier.

![alt text](https://github.com/mikkelhm/Umbraco-Google-maps-routeplanner-property-editor/blob/master/markdown/backoffice.png "Screenshot from Umbraco")
_above is a screenshot from an Umbraco 7.2.1 installation where the routeplanner is used to draw a route_

A recording of the video can be viewed in this youtube https://www.youtube.com/watch?v=MrTa5p-GNkI

Prevalues enabled in the fieldtype is:

* apiKey
* initialLat
* initialLng
* initialZoom
* showDebug
* pointMarker
* pointMarkerSize
* strokeColor

The package contains of the property editor parts, but also a render part. The MVC HtmlHelper has been extended, and the following two methods are avalible:
```
@Html.GetRouteHtml()
```
This will just render a div on the place of you page where you need it. You can specify an id, which will be used for the javascript part, to render the map in the div. It is highly recommended to set a height of the div, or take care of in your css. The code will always render a style="height:xxxpx", so in css, you need to specify the !important attribute to override.

The second helper method is 
```
@Html.GetRouteJs()
```
This method allows you to set all the settings will render a javascript object that contains them. It also allows to add the javascript as a part of the ClientDependencyFramework, by using the useCDF property, which is true as default. It is worth mentioning that you need to use the `@Html.RenderJsHere() ` in order to get the map working. If you set the useCDF to false, it will simply render the javascript where you put the `@Html.GetRouteJs()`.