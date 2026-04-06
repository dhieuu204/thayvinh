Auth Controller
Hiện tại: register, login, forgotPassword, verifyOTP, resetPassword, getAllUsers
Thêm mới: refreshToken, googleOAuthCallback, logout (xóa refresh token khỏi cookie)
User Controller
Hiện tại: getUser, updateProfile, getProfile, deleteAccount
Thêm mới: banUser (admin), getLoyaltyPoints, redeemPoints
Product Controller
Hiện tại: getAll, getById, search, filterByCategory, filterByPrice, getFlashSales
Thêm mới: createProduct (admin), updateProduct (admin), deleteProduct (admin), getVariants, getRelated, notifyRestock, getRestockSubscribers
Category Controller
Hiện tại: CRUD cơ bản (getAll, getById, create, update, delete)
Không thay đổi nhiều — có thể thêm getProductsByCategory với pagination
Cart Controller
Hiện tại: viewCart, addToCart, updateCart, removeItem, clearCart
Thêm mới: applyVoucher (tính discount trước khi checkout), removeVoucher
Order Controller
Hiện tại: createOrder (chưa trừ tồn kho), getMyOrders, deleteOrder
Sửa lại: createOrder phải thêm check tồn kho atomic + trừ tồn kho + gửi email + ghi VoucherUsage
Thêm mới: cancelOrder, createReturnRequest, getReturnRequests (admin), approveReturn (admin), rejectReturn (admin)
Payment Controller
Hiện tại: có controller nhưng chưa tích hợp thật
Sửa lại hoàn toàn: createVNPayUrl, vnpayReturn (callback + verify HMAC), createMoMoRequest (tuỳ chọn), getPaymentStatus
Voucher Controller (mới hoàn toàn)
Admin: createVoucher, getAllVouchers, getVoucherById, updateVoucher, deleteVoucher, toggleVoucher
User: applyVoucher, checkVoucherCode
Review Controller (mới hoàn toàn)
User: createReview (check đã mua chưa), getReviewsByProduct, updateReview, deleteReview
Admin: replyReview, deleteAnyReview
WishList Controller
Hiện tại: getWishlist, addToWishlist, removeFromWishlist
Thêm mới: không cần thêm endpoint — nhưng bên trong addToWishlist cần lưu để sau này trigger price drop notification
Notification Controller (mới hoàn toàn)
getNotifications, markAsRead, markAllAsRead, getUnreadCount
Không có endpoint tạo notification từ phía user — notification được tạo tự động bên trong các controller khác (OrderController, AdminController, ProductController)
Admin Controller
Hiện tại: hầu như trống, chỉ dùng middleware authorizeAdmin
Thêm mới:
* Thống kê: getOverview, getRevenueStats, getTopProducts, getTopCustomers, getCategoryStats, getLowStockAlert, getOrdersByStatus
* Quản lý đơn: getAllOrders, updateOrderStatus
* Quản lý user: getAllUsers (chuyển từ AuthController sang đây), banUser
* Quản lý banner: CRUD banner
* Quản lý flash sale: CRUD flash sale, tự động kết thúc qua cron job
Shipping Controller (mới hoàn toàn)
calculateShippingFee (theo tỉnh thành), getShippingZones (admin CRUD), trackOrder (call GHN API)
