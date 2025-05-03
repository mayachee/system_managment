from django.db import migrations, models
import django.db.models.deletion

class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('locations', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='Car',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('make', models.CharField(max_length=100)),
                ('model', models.CharField(max_length=100)),
                ('year', models.IntegerField()),
                ('status', models.CharField(choices=[('available', 'Available'), ('rented', 'Rented'), ('maintenance', 'Maintenance')], default='available', max_length=20)),
                ('car_id', models.CharField(max_length=20, unique=True)),
                ('location', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='cars', to='locations.location')),
            ],
        ),
    ]