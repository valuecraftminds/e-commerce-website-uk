// Dummy data

import couple from '../assets/couple.jpg';
import YellowLady from '../assets/yellow lady.jpg';
import WhiteLady from '../assets/white lady.jpg';
import couple_blue from '../assets/couple-blue.jpg';
import couple_green from '../assets/couple-green.jpg';
import girl_t_rose from '../assets/girl-T-rose.png';
import kid_girl from '../assets/kid-girl.png';
import kid_kit from '../assets/kid-kit.png';
import kid_yellow from '../assets/kid-yellow.png';
import lily_hoodie from '../assets/lily-hoodie.jpg';
import men_trouser from '../assets/men-trouser.png';
import rainbow_men from '../assets/rainbow-men.png';
import red_t from '../assets/red-T.png';
import white_t_girl from '../assets/white-T-girl.png';
import women_trouser from '../assets/women-trouser.png';

const DataFile = {
  banner: [
    {
      id: 1,
      image: couple_blue,
      title: 'Fresh Styles for Him',
      description: 'Cool coordinated couple looks.',
      category: 'men'
    },
    {
      id: 2,
      image: lily_hoodie,
      title: 'Winter Picks for Her',
      description: 'Warm and cozy hoodies for women.',
      category: 'women'
    },
    {
      id: 3,
      image: kid_yellow,
      title: 'Bright Days for Kids',
      description: 'Colorful, playful, and comfy!',
      category: 'kids'
    },
    {
      id: 4,
      image: couple_green,
      title: 'Stylish Couples',
      description: 'Matching outfits for every occasion.',
      category: 'couples'
    }
  ],

  newReleases: [
    {
      id: 1,
      name: 'Couple Shirt',
      image: couple,
      category: 'men',
      description: 'Matching couple wear'
    },
    {
      id: 2,
      name: 'Yellow Dress',
      image: YellowLady,
      category: 'women',
      description: 'Stylish yellow summer dress'
    },
    {
      id: 3,
      name: 'White Dress',
      image: WhiteLady,
      category: 'women',
      description: 'Elegant white evening dress'
    },
    {
      id: 4,
      name: 'Rainbow Tee',
      image: rainbow_men,
      category: 'men',
      description: 'Colorful men’s t-shirt for any occasion'
    },
    {
      id: 5,
      name: 'Red T-shirt',
      image: red_t,
      category: 'men',
      description: 'Bold red casual t-shirt'
    },
    {
      id: 6,
      name: 'White Tee Girl',
      image: white_t_girl,
      category: 'kids',
      description: 'Chic white t-shirt for girls'
    },
    {
      id: 7,
      name: 'Couple Green',
      image: couple_green,
      category: 'women',
      description: 'Stylish couple hoodie'
    }
  ],

  categories: [
    {
      id: 1,
      name: 'T shirts',
      image: YellowLady,
      category: 'women',
      description: 'Bright and bold summer wear'
    },
    {
      id: 2,
      name: 'Crop Tops',
      image: WhiteLady,
      category: 'women',
      description: 'Sleek and elegant fashion'
    },
    {
      id: 3,
      name: 'Trousers (Women)',
      image: women_trouser,
      category: 'women',
      description: 'Stylish and comfy trousers'
    },
    {
      id: 4,
      name: 'Rose T-Shirt',
      image: girl_t_rose,
      category: 'women',
      description: 'Floral themed fashion'
    },
    {
      id: 5,
      name: 'Rainbow Tee',
      image: rainbow_men,
      category: 'men',
      description: 'Bold and colorful statement piece'
    },
    {
      id: 6,
      name: 'Red T-shirt',
      image: red_t,
      category: 'men',
      description: 'Simple and sleek casual wear'
    },
    {
      id: 7,
      name: 'Trousers (Men)',
      image: men_trouser,
      category: 'men',
      description: 'Everyday essentials'
    },
    {
      id: 8,
      name: 'Yellow Hoodie',
      image: kid_yellow,
      category: 'kids',
      description: 'Bright and comfy hoodie'
    },
    {
      id: 9,
      name: 'Girls Outfit',
      image: kid_girl,
      category: 'kids',
      description: 'Cute and playful sets'
    },
    {
      id: 10,
      name: 'Kids Kit',
      image: kid_kit,
      category: 'kids',
      description: 'Fun prints for active kids'
    }
  ]
};

export default DataFile;

