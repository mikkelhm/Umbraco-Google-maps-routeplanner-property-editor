using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace RoutePlanner.Model
{
   public class Route
    {
        public List<latLng> latLngs { get; set; }
        public List<marks> points { get; set; }
        public double distance { get; set; }
        public bool isKMLImported { get; set; }
        public int zoom { get; set; }
        public latLng center { get; set; }
    }
}
