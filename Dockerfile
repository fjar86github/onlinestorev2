# Menggunakan image PHP 5.3 dengan Apache
FROM php:5.3-apache

# Menginstal dependensi yang diperlukan
RUN apt-get update && apt-get install -y libmysqlclient-dev

# Mengaktifkan mod_rewrite untuk Apache
RUN a2enmod rewrite

# Menyalin file aplikasi ke dalam container
COPY . /var/www/html/

# Mengatur izin untuk folder web agar dapat ditulis oleh Apache
RUN chown -R www-data:www-data /var/www/html/

# Menjalankan Apache
CMD ["apache2-foreground"]
