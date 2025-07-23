// Dummy data

import couple from '../assets/couple.jpg';
import YellowLady from '../assets/yellow lady.jpg';
import WhiteLady from '../assets/white lady.jpg';


const DataFile = {
 couple,
  newReleases: [
    {
      id: 1,
      name: 'Couple Shirt',
      image: couple,
      description: 'Matching couple wear'
    },
    {
      id: 2,
      name: 'Yellow Dress',
      image: YellowLady,
      description: 'Stylish yellow summer dress'
    },
    {
      id: 3,
      name: 'White Dress',
      image: WhiteLady,
      description: 'Elegant white evening dress'
    }
  ],
  categories: [
    {
      id: 1,
      name: 'Top',
      image: couple,
      description: 'Trendy tops'
    },
    {
      id: 2,
      name: 'Trouser',
      image: YellowLady,
      description: 'Comfortable trousers'
    },
    {
      id: 3,
      name: 'Shoes',
      image: WhiteLady,
      description: 'Stylish shoes'
    }
  ]
};


export default DataFile;
