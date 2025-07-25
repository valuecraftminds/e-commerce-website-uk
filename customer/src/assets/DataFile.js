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
    {catId: 1, name: 'Women'},
    {catId: 2, name: 'Men'},
    {catId: 3, name: 'Kids'},
  ],

  productTypes: [
    { prId: 1, name: 'tshirts' },
    { prId: 2, name: 'trousers' },
    { prId: 3, name: 'shoes' },
    { prId: 4, name: 'accessories' },
    { prId: 5, name: 'hoodies' }
  ],

  productTypeDetails: [
     {
      id: 1,
      name: 'Couple T-shirts',
      image: couple,
      category: ['women', 'men'],
      description: 'Couple t-shirts',
      sizes: ['S', 'M', 'L', 'XL'],
      colors: ['Red', 'Blue', 'Black'],
      price: 45.99
  },
  {
      id: 2,
      name: 'Women T-shirts',
      image: YellowLady,
      category: ['women'],
      description: 'Stylish yellow t-shirt for ladies',
      sizes: ['S', 'M', 'L', 'XL'],
      colors: ['Yellow', 'White', 'Black'],
      price: 39.99
  },
  {
      id: 3,
      name: 'Women T-shirts',
      image: WhiteLady,
      category: ['women'],
      description: 'Elegant white t-shirt for ladies',
      sizes: ['S', 'M', 'L', 'XL'],
      colors: ['White', 'Black'],
      price: 42.99
  },
  {
      id: 4,
      name: 'Couple T-shirts',
      image: couple_blue,
      category: ['women', 'men'],
      description: 'Couple blue t-shirts',
      sizes: ['S', 'M', 'L', 'XL'],
      colors: ['Blue', 'Black'],
      price: 45.99
  },
  {
      id: 5,
      name: 'Couple T-shirts',
      image: couple_green,
      category: ['women', 'men'],
      description: 'Couple green t-shirts',
      sizes: ['S', 'M', 'L', 'XL'],
      colors: ['Green', 'Black'],
      price: 45.99
  },
  {
      id: 6,
      name: 'Women T-shirts',
      image: girl_t_rose,
      category: ['women'],
      description: 'Stylish t-shirt for girls',
      sizes: ['S', 'M', 'L', 'XL'],
      colors: ['Pink', 'White', 'Black'],
      price: 35.99
  },
  // {
  //     id: 7,
  //     name: 'Kid T-Shirts',
  //     image: kid_girl,
  //     category: ['kids'],
  //     description: 'Cute t-shirt for young girls',
  //     sizes: ['S', 'M', 'L'],
  //     colors: ['Pink', 'Purple', 'White'],
  //     price: 29.99
  // }, 
  {
      id: 8,
      name: 'Kids Full Kit',
      image: kid_girl,
      category: ['kids'],
      description: 'Stylish outfit for girls',
      sizes: ['S', 'M', 'L', 'XL'],
      colors: ['Red', 'Blue', 'Black'],
      price: 30.99
},
{
    id: 9,
    name: 'Kids Full Kit',
    image: kid_kit,
    category: ['kids'],
    description: 'Fun and playful kids kit',
    sizes: ['S', 'M', 'L', 'XL'],
    colors: ['Red', 'Blue', 'Black'],
    price: 25.99
},
{
  id: 10,
  name: 'Kids T-Shirts',
  image: kid_yellow,
  category: ['kids'],
  description: 'Bright and comfy t-shirt for kids',
  sizes: ['S', 'M', 'L', 'XL'],
  colors: ['Yellow', 'Blue', 'Black'],
  price: 20.99
},
{
  id: 11,
  name: 'Women T-shirts',
  image: lily_hoodie,
  category: ['women'],
  description: 'Cozy winter hoodie for women',
  sizes: ['S', 'M', 'L', 'XL'],
  colors: ['Red', 'Blue', 'Black'],
  price: 39.99
},
{
  id: 12,
  name: 'Men Trousers',
  image: men_trouser,
  category: ['men'],
  description: 'Stylish and comfy trousers for men',
  sizes: ['S', 'M', 'L', 'XL'],
  colors: ['Red', 'Blue', 'Black'],
  price: 35.99
},
{
  id: 13,
  name: 'Men T-shirts',
  image: rainbow_men,
  category: ['men'],
  description: 'Colorful t-shirt for any occasion',
  sizes: ['S', 'M', 'L', 'XL'],
  colors: ['Red', 'Blue', 'Black'],
  price: 15.99
},
{
  id: 14,
  name: 'Men T-shirts',
  image: red_t,
  category: ['men'],
  description: 'Bold red casual t-shirt',
  sizes: ['S', 'M', 'L', 'XL'],
  colors: ['Red', 'Blue', 'Black'],
  price: 50.00
},
{
  id: 15,
  name: 'Women T-shirts',
  image: white_t_girl,
  category: ['women'],
  description: 'Chic white t-shirt for girls',
  sizes: ['S', 'M', 'L', 'XL'],
  colors: ['Red', 'Blue', 'Black'],
  price: 45.99
},
{
  id: 16,
  name: 'Women Trousers',
  image: women_trouser,
  category: ['women'],
  description: 'Stylish and comfy trousers for women',
  sizes: ['S', 'M', 'L', 'XL'],
  colors: ['Red', 'Blue', 'Black'],
  price: 34.99
}
  ]
};

export default DataFile;