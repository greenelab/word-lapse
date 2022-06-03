locals {
  // timestamp = regex_replace(timestamp(), "[- TZ:]", "")
  curdate = formatdate("YYYY-MM-DD", timestamp())
}

source "googlecompute" "standard" {
  disk_size               = "10"
  disk_additional_size    = [ 65 ]
  image_family            = "word-lapse-models"
  image_name              = "wl-models-${local.curdate}"
  project_id              = "word-lapse"
  source_image_family     = "ubuntu-2004-lts"
  source_image_project_id = "ubuntu-os-cloud"
  ssh_username            = "ubuntu"
  zone                    = "us-central1-a"
}

build {
  sources = ["source.googlecompute.standard"]

  provisioner "shell" {
    inline = ["cloud-init status --wait"]
  }

  provisioner "shell" {
    inline = [
      "sudo apt update && sudo apt install git git-lfs",
      "git clone https://github.com/greenelab/word-lapse-models.git"
    ]
  }
}
