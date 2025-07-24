// import { useParams } from "react-router-dom";
// import DataFile from "../assets/DataFile";

// export default function ProductCategory() {
//   const { category, productType } = useParams();

//   // handle lowercase for safe comparison
//   const currentCategory = category?.toLowerCase();
//   const currentProductType = productType?.toLowerCase();

//   const filteredProducts = DataFile.newReleases.filter((product) => {
//     const categoryMatch = Array.isArray(product.category)
//       ? product.category.map(c => c.toLowerCase()).includes(currentCategory)
//       : product.category.toLowerCase() === currentCategory;

//     // Check productType
//     if (currentProductType) {
//       return (
//         categoryMatch &&
//         product.productType?.toLowerCase() === currentProductType
//       );
//     }
//     return categoryMatch;
//   });

//   return (
//     <div>
//       <h1>
//         {category} {productType ? productType : ""} Products
//       </h1>

//       {filteredProducts.length === 0 && <p>No products found.</p>}

//       <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem" }}>
//         {filteredProducts.map((product) => (
//           <div
//             key={product.id}
//             style={{
//               border: "1px solid #ccc",
//               padding: "1rem",
//               width: "200px",
//               borderRadius: "8px",
//             }}
//           >
//             <img
//               src={product.image}
//               alt={product.name}
//               style={{ width: "100%", borderRadius: "5px" }}
//             />
//             <h5>{product.name}</h5>
//             <p>{product.description}</p>
//             <p>
//               Price: <strong>${product.price.toFixed(2)}</strong>
//             </p>
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// }
