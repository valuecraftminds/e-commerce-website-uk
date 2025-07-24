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
    category: ['men', 'women'],
    description: 'Matching couple wear',
    sizes: ['S', 'M', 'L', 'XL'],
    colors: ['Red', 'Blue', 'Black'],
    price: 35.99
  },
    {
      id: 2,
      name: 'Yellow Tshirt',
      image: YellowLady,
      category: 'women',
      description: 'Stylish yellow summer tshirt',
      sizes: ['S', 'M', 'L', 'XL'],
    colors: ['Red', 'Blue', 'Black'],
    price: 29.99
    },
    {
      id: 3,
      name: 'White Tshirt',
      image: WhiteLady,
      category: 'women',
      description: 'Elegant white evening tshirt',
      sizes: ['S', 'M', 'L', 'XL'],
      colors: ['Red', 'Blue', 'Black'],
      price: 50.99
    },
    {
      id: 4,
      name: 'Rainbow T',
      image: rainbow_men,
      category: 'men',
      description: 'Colorful men’s t-shirt for any occasion',
      sizes: ['S', 'M', 'L', 'XL'],
      colors: ['Red', 'Blue', 'Black'],
      price: 15.99
    },
    {
      id: 5,
      name: 'Red T',
      image: red_t,
      category: 'men',
      description: 'Bold red casual t-shirt',
      sizes: ['S', 'M', 'L', 'XL'],
      colors: ['Red', 'Blue', 'Black'],
      price: 50.00
    },
    {
      id: 6,
      name: 'White T',
      image: white_t_girl,
      category: 'women',
      description: 'Chic white t-shirt for girls',
      sizes: ['S', 'M', 'L', 'XL'],
      colors: ['Red', 'Blue', 'Black'],
      price: 45.99
    },
    {
      id: 7,
      name: 'Couple Green',
      image: couple_green,
      category: 'women',
      description: 'Stylish couple hoodie',
      sizes: ['S', 'M', 'L', 'XL'],
      colors: ['Red', 'Blue', 'Black'],
      price: 30.99
    },
    {
      id: 8,
      name: 'Kid-girl',
      image: kid_girl,
      category: 'kids',
      description: 'Stylish kid-girl outfit',
      sizes: ['S', 'M', 'L', 'XL'],
      colors: ['Red', 'Blue', 'Black'],
      price: 30.99
    },
    {
      id: 9,
      name: 'Kid-kit',
      image: kid_kit,
      category: 'kids',
      description: 'Fun and playful kids kit',
      sizes: ['S', 'M', 'L', 'XL'],
      colors: ['Red', 'Blue', 'Black'],
      price: 25.99
    },
    {
      id: 10,
      name: 'Kid-yellow',
      image: kid_yellow,
      category: 'kids',
      description: 'Bright and comfy hoodie for kids',
      sizes: ['S', 'M', 'L', 'XL'],
      colors: ['Red', 'Blue', 'Black'],
      price: 20.99
    },
    {
      id: 11,
      name: 'trouser',
      image: men_trouser,
      category: 'men',
      description: 'Stylish and comfy trousers for men',
      sizes: ['S', 'M', 'L', 'XL'],
      colors: ['Red', 'Blue', 'Black'],
      price: 35.99 
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
      name: 'Shoes',
      image: girl_t_rose,
      category: 'women',
      description: 'Floral themed fashion'
    },
    {
      id: 5,
      name: 'Accessories',
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
      name: 'Hoodie',
      image: kid_yellow,
      category: 'kids',
      description: 'Bright and comfy hoodie'
    },
    {
      id: 9,
      name: 'Girls',
      image: kid_girl,
      category: 'kids',
      description: 'Cute and playful sets'
    },
    {
      id: 10,
      name: 'Boys',
      image: kid_kit,
      category: 'kids',
      description: 'Fun prints for active kids'
    }
  ]
};

export default DataFile;

