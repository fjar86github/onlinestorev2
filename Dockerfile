# Menggunakan image PHP 7.4 dengan Apache
FROM php:7.4-apache

# Menginstal dependensi yang diperlukan untuk pdo_mysql
RUN apt-get update && apt-get install -y \
    default-libmysqlclient-dev \
    && docker-php-ext-install pdo pdo_mysql

# Mengaktifkan mod_rewrite untuk Apache
RUN a2enmod rewrite

# Menyalin file aplikasi ke dalam container
COPY . /var/www/html/

# Mengatur izin untuk folder web agar dapat ditulis oleh Apache
RUN chown -R www-data:www-data /var/www/html/

# Menjalankan Apache
CMD ["apache2-foreground"]
