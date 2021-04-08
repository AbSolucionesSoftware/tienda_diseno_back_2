const homeCtrl = {};
const bcrypt = require('bcrypt-nodejs');
const adminModel = require('../models/Administrador');
const modelBanner = require('../models/BannerCategoria');
const Carrito = require('../models/Carrito');
const Tienda = require('../models/Tienda');
const promocionModel = require('../models/PromocionProducto');
const Carousel = require('../models/Carousel');
const Producto = require('../models/Producto');


homeCtrl.homaQuerysShop = async (req,res) => {
    try {
        //Filtro nadvar (Categoria,genero,temporada), Carrucel, ofertas, quienes somos, carritoCantidad, carrito, banners \
        const idUser = req.params.idUser;
        const home = {
            filtroNav: [],
            carrucel:[],
            ofertas: false,
            tienda: [],
            carritoCantidad: 0,
            banners: []
        };

        if(idUser){
            const carritoUser = await Carrito.findOne({cliente: idUser});
            if(carritoUser){
                home.carritoCantidad = carritoUser.articulos.length;
            }else{
                home.carritoCantidad = 0;
            }
        }

        const banners = await modelBanner.find({publicado: true}).sort({createdAt: 1});
        home.banners = banners;

        const tienda = await Tienda.find();
        home.tienda = tienda;

        const promociones = await promocionModel.find({ idPromocionMasiva: { $exists: false } });
        if(promociones.length){
            home.ofertas = true;
        }else{
            home.ofertas = false;
        }

        const Carrucel = await Carousel.find().sort({ "createdAt" : -1}).limit(10);
        home.carrucel = Carrucel;

        await Producto.aggregate(
			[
				{
					$match: {
						$or: [ { eliminado: { $exists: false } }, { eliminado: false } ]
					}
				},
				{ $group: { _id: '$categoria' } }
			],
			async function(err, categorias) {
				arrayCategorias = [];
				for (i = 0; i < categorias.length; i++) {
					if (categorias[i]._id !== null) {
						if (categorias[i]._id) {
						const subCategoriasBase =await Producto.aggregate(
								[
									{
										$match: {
											$or: [ { categoria: categorias[i]._id } ]
										}
									},
									{
										$group: { _id: '$subCategoria' }
									}
								],
								async function(err, subCategoriasBase) {
									return subCategoriasBase;
								}
							);
							arrayCategorias.push({
								categoria: categorias[i]._id,
								subcCategoria: subCategoriasBase
							});
						}
					}
				}
                home.filtroNav = arrayCategorias;
				res.status(200).json(home);
				// console.log(arrayCategorias);
			}
		);  
    } catch (error) {
        res.status(500).json({ message: "Error en el servidor",error });	
    }
}


module.exports = homeCtrl;