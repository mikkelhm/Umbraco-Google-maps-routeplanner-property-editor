using System;
using System.Web.Helpers;
using Umbraco.Web.WebApi;

namespace RoutePlanner.Controllers
{
    public class RoutePlannerController : UmbracoApiController
    {
        public object GetRoute(int id, string propertyAlias)
        {
            var run = Services.ContentService.GetById(id);
            dynamic coordinates = null;
            dynamic distance = null;
            if (run.HasProperty(propertyAlias))
            {
                if (!String.IsNullOrEmpty(run.GetValue<string>(propertyAlias)))
                {
                    coordinates = Json.Decode(run.GetValue<string>(propertyAlias)).LatLngs;
                    distance = Json.Decode(run.GetValue<string>(propertyAlias)).Distance;
                }
            }
            var result = new
            {
                Distance = distance,
                Coordinates = coordinates
            };
            
            return result;
        }
    }

}