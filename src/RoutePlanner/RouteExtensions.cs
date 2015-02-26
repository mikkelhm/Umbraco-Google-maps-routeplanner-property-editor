using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Web.Mvc;
using System.Web.Script.Serialization;
using ClientDependency.Core.Mvc;
using Umbraco.Core.Models;
using umbraco.presentation.channels;
using Archetype.Models;

namespace RoutePlanner
{
    public static class RouteExtensions
    {
        /// <summary>
        /// Renderes a div that can be used for putting the map into.
        /// </summary>
        /// <param name="html"></param>
        /// <param name="contentItem">The itm that contains the property</param>
        /// <param name="propertyAlias">The alias of the property</param>
        /// <param name="divId">The id if the div</param>
        /// <param name="heightPx">A height of the div, should be overridden via Css !important in your custom stylesheet</param>
        /// <returns></returns>
        public static MvcHtmlString GetRouteHtml(this HtmlHelper html, IPublishedContent contentItem,
            string propertyAlias, string divId = "map-canvas", int heightPx = 400)
        {
            var prop = contentItem.GetProperty(propertyAlias);
            if (!prop.HasValue)
                return new MvcHtmlString("");
            // return a div that the map can be rendered in
            return new MvcHtmlString(String.Format("<div id='{0}' style='height:{1}px;'></div>", divId, heightPx));
        }

		/// <summary>
		/// Renderes a div that can be used for putting the map into.
		/// </summary>
		/// <param name="html"></param>
		/// <param name="contentItem">The itm that contains the property (ArcheTypeModel</param>
		/// <param name="propertyAlias">The alias of the property</param>
		/// <param name="divId">The id if the div</param>
		/// <param name="heightPx">A height of the div, should be overridden via Css !important in your custom stylesheet</param>
		/// <returns></returns>
		public static MvcHtmlString GetRouteHtml(this HtmlHelper html, ArchetypeFieldsetModel contentItem,
			string propertyAlias, string divId = "map-canvas", int heightPx = 400)
		{
			if (contentItem.HasProperty(propertyAlias) == false || contentItem.HasValue(propertyAlias) == false)
				return new MvcHtmlString("");
			// return a div that the map can be rendered in
			return new MvcHtmlString(String.Format("<div id='{0}' style='height:{1}px;'></div>", divId, heightPx));

		}

        /// <summary>
        /// This will render the Javascript required for the map to actualy draw.
        /// You can set most properties youselfe, but you can also just leave them, to gain the defaults.
        /// </summary>
        /// <param name="html"></param>
        /// <param name="contentItem">The item that contains the property</param>
        /// <param name="propertyAlias">the alias of the property</param>
        /// <param name="divId">the id if the div that should contain the map</param>
        /// <param name="useCDF">Set to true, if you are using CDF(recommended), if set to false, the javascript references will be rendered inline just after this</param>
        /// <param name="strokeColor">color of the stroke in #XXXXXX format</param>
        /// <param name="strokeOpacity">The opacity, between 0 and 1 (use i.e. 0.4)</param>
        /// <param name="strokeWeight">The weight in px of the stroke</param>
        /// <param name="lat">The initial lat</param>
        /// <param name="lng">The initial lng</param>
        /// <param name="zoom">The default zoom</param>
        /// <param name="fitBounds">If true, the map will try to find a proper zoom and center when the route is set, if false, the initial lat/lng will be used</param>
        /// <returns></returns>
        public static MvcHtmlString GetRouteJs(this HtmlHelper html, IPublishedContent contentItem,
            string propertyAlias, string divId = "map-canvas", bool useCDF = true, string strokeColor = "#0000FF",
            string strokeOpacity = "1.0", int strokeWeight = 4, string lat = "55.4062018557889", string lng = "10.388356447219849",
            int zoom = 14, bool fitBounds = true, string apiKey = "")
        {
            var prop = contentItem.GetProperty(propertyAlias);
            if (!prop.HasValue)
                return new MvcHtmlString("");
            // Render a javascript object that contains the settings
            var js = @"<script type='text/javascript'>
                            var RoutePlanner = RoutePlanner || {};
                            RoutePlanner.settings = {
                                map: null,
                                routeLine : null,
                                contentId: " + contentItem.Id + @",
                                divId : '" + divId + @"',
                                propertyAlias: '" + propertyAlias + @"',
                                strokeColor: '" + strokeColor + @"',
                                strokeOpacity: " + strokeOpacity + @",
                                strokeWeight: " + strokeWeight + @",
                                lat: " + lat + @",
                                lng: " + lng + @",
                                zoom: " + zoom + @",
                                fitBounds: " + fitBounds.ToString().ToLower() + @"
                            }
                        </script>";
            // register with CDF if used(default)
            if (useCDF)
            {
                html.RequiresJs(string.Format("//maps.googleapis.com/maps/api/js?key={0}&sensor=false", apiKey));
                html.RequiresJs("/app_plugins/routeplanner/external/routeplanner-external.js");
            }
            else
            {
                // Render the references direct on the page
                js += string.Format("<script type='text/javascript' src='//maps.googleapis.com/maps/api/js?key={0}&sensor=false'></script>", apiKey);
                js += "<script type='text/javascript' src='/app_plugins/routeplanner/external/routeplanner-external.js'></script>";
            }
            return new MvcHtmlString(js);
        }

		/// <summary>
		/// This will render the Javascript required for the map to actualy draw.
		/// You can set most properties youselfe, but you can also just leave them, to gain the defaults.
		/// </summary>
		/// <param name="html"></param>
		/// <param name="contentItem">The item that contains the property</param>
		/// <param name="propertyAlias">the alias of the property</param>
		/// <param name="divId">the id if the div that should contain the map</param>
		/// <param name="useCDF">Set to true, if you are using CDF(recommended), if set to false, the javascript references will be rendered inline just after this</param>
		/// <param name="strokeColor">color of the stroke in #XXXXXX format</param>
		/// <param name="strokeOpacity">The opacity, between 0 and 1 (use i.e. 0.4)</param>
		/// <param name="strokeWeight">The weight in px of the stroke</param>
		/// <param name="lat">The initial lat</param>
		/// <param name="lng">The initial lng</param>
		/// <param name="zoom">The default zoom</param>
		/// <param name="fitBounds">If true, the map will try to find a proper zoom and center when the route is set, if false, the initial lat/lng will be used</param>
		/// <returns></returns>
		public static MvcHtmlString GetRouteJs(this HtmlHelper html, ArchetypeFieldsetModel contentItem,
			string propertyAlias, string divId = "map-canvas", bool useCDF = true, string strokeColor = "#0000FF",
			string strokeOpacity = "1.0", int strokeWeight = 4, string lat = "55.4062018557889", string lng = "10.388356447219849",
			int zoom = 14, bool fitBounds = true, string apiKey = "")
		{
			if (contentItem.HasProperty(propertyAlias) == false || contentItem.HasValue(propertyAlias) == false)
				return new MvcHtmlString("");
			// Render a javascript object that contains the settings
			var js = @"<script type='text/javascript'>
                            var RoutePlanner = RoutePlanner || {};
                            RoutePlanner.settings = {
                                map: null,
                                routeLine : null,
                                contentId: ArchetypeFieldsetModel." + contentItem.Alias + @",
                                divId : '" + divId + @"',
                                propertyAlias: '" + propertyAlias + @"',
                                strokeColor: '" + strokeColor + @"',
                                strokeOpacity: " + strokeOpacity + @",
                                strokeWeight: " + strokeWeight + @",
                                lat: " + lat + @",
                                lng: " + lng + @",
                                zoom: " + zoom + @",
                                fitBounds: " + fitBounds.ToString().ToLower() + @"
                            }
                        </script>";
			// register with CDF if used(default)
			if (useCDF)
			{
				html.RequiresJs(string.Format("//maps.googleapis.com/maps/api/js?key={0}&sensor=false", apiKey));
				html.RequiresJs("/app_plugins/routeplanner/external/routeplanner-external.js");
			}
			else
			{
				// Render the references direct on the page
				js += string.Format("<script type='text/javascript' src='//maps.googleapis.com/maps/api/js?key={0}&sensor=false'></script>", apiKey);
				js += "<script type='text/javascript' src='/app_plugins/routeplanner/external/routeplanner-external.js'></script>";
			}
			return new MvcHtmlString(js);
		}

    }
}
