import {hdf5Reader, type_enum as HDF5_type_enum} from "./HDF5Loader";
import {netcdfReader, type_enum as NetCDF_type_enum} from "./NetCDFLoader";
let type_enum;
/*
 * BrainBrowser: Web-based Neurological Visualization Tools
 * (https://brainbrowser.cbrain.mcgill.ca)
 *
 * Copyright (C) 2016
 * The Royal Institution for the Advancement of Learning
 * McGill University
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

/*
 * Author: Robert D. Vincent (robert.d.vincent@mcgill.ca)
 *
 */
  'use strict';
  /*
   * The remaining code after this point is not truly HDF5 specific -
   * it's mostly about converting the MINC file into the form
   * BrainBrowser is able to use. Therefore it is used for both HDF5
   * and NetCDF files.
   */

  function defined(x) {
    return typeof x !== 'undefined';
  }

  function typeName(x) {
    if (!defined(x)) {
      return "undefined";
    }
    return x.constructor.name;
  }

  function typeIsFloat(typ) {
    return (typ >= type_enum.FLT && typ <= type_enum.DBL);
  }

  /*
   * Join does not seem to be defined on the typed arrays in
   * javascript, so I've re-implemented it here, sadly.
   */
  function join(array, string) {
    var result = "";
    if (array && array.length) {
      var i;
      for (i = 0; i < array.length - 1; i += 1) {
        result += array[i];
        result += string;
      }
      result += array[i];
    }
    return result;
  }

  /*
   * Recursively print out the structure and contents of the file.
   * Primarily useful for debugging.
   */
  function printStructure(link, level) {
    var i;
    var msg = "";
    for (i = 0; i < level * 2; i += 1) {
      msg += " ";
    }
    msg += link.name + (link.children.length ? "/" : "");
    if (link.type > 0) {
      msg += ' ' + typeName(link.array);
      if (link.dims.length) {
        msg += '[' + link.dims.join(', ') + ']';
      }
      if (link.array) {
        msg += ":" + link.array.length;
      } else {
        msg += " NULL";
      }
    }
    console.log(msg);

    Object.keys(link.attributes).forEach(function (name) {
      var value = link.attributes[name];

      msg = "";
      for (i = 0; i < level * 2 + 1; i += 1) {
        msg += " ";
      }
      msg += link.name + ':' + name + " " +
        typeName(value) + "[" + value.length + "] ";
      if (typeof value === "string") {
        msg += JSON.stringify(value);
      } else {
        msg += "{" + join(value.slice(0, 16), ', ');
        if (value.length > 16) {
          msg += ", ...";
        }
        msg += "}";
      }
      console.log(msg);
    });

    link.children.forEach(function (child) {
      printStructure(child, level + 1);
    });
  }

  /* Find a dataset with a given name, by recursively searching through
   * the links. Groups will have 'type' fields of -1, since they contain
   * no data.
   * TODO (maybe): Use associative array for children?
   */
  function findDataset(link, name, level) {
    var result;
    if (link.name === name && link.type > 0) {
      result = link;
    } else {
      link.children.find( function( child ) {
        result = findDataset(child, name, level + 1);
        return defined(result);
      });
    }
    return result;
  }

  /* Find an attribute with a given name.
   */
  function findAttribute(link, name, level) {
    var result = link.attributes[name];
    if (result)
      return result;

    link.children.find( function (child ) {
      result = findAttribute( child, name, level + 1);
      return defined(result);
    });
    return result;
  }

  /**
   * @doc function
   * @name hdf5.scaleVoxels
   * @param {object} image The link object corresponding to the image data.
   * @param {object} image_min The link object corresponding to the image-min
   * data.
   * @param {object} image_max The link object corresponding to the image-max
   * data.
   * @param {object} valid_range An array of exactly two items corresponding
   * to the minimum and maximum valid _raw_ voxel values.
   * @param {boolean} debug True if we should print debugging information.
   * @returns A new ArrayBuffer containing the rescaled data.
   * @description
   * Convert the MINC data from voxel to real range. This returns a
   * new buffer that contains the "real" voxel values. It does less
   * work for floating-point volumes, since they don't need scaling.
   *
   * For debugging/testing purposes, also gathers basic voxel statistics,
   * for comparison against mincstats.
   */
  function scaleVoxels(image, image_min, image_max, valid_range, debug) {
    var new_abuf = new ArrayBuffer(image.array.length *
                                   Float32Array.BYTES_PER_ELEMENT);
    var new_data = new Float32Array(new_abuf);
    var n_slice_dims = image.dims.length - image_min.dims.length;

    if (n_slice_dims < 1) {
      throw new Error("Too few slice dimensions: " + image.dims.length +
                      " " + image_min.dims.length);
    }
    var n_slice_elements = 1;
    var i;
    for (i = image_min.dims.length; i < image.dims.length; i += 1) {
      n_slice_elements *= image.dims[i];
    }
    if (debug) {
      console.log(n_slice_elements + " voxels in slice.");
    }
    var real_sum = 0;
    var n_voxels = 0;
    var real_max = -Number.MAX_VALUE;
    var real_min = Number.MAX_VALUE;
    var im = image.array;
    var im_max = image_max.array;
    var im_min = image_min.array;
    if (debug) {
      console.log("valid range is " + valid_range[0] + " to " + valid_range[1]);
    }
    var vrange;
    var rrange;
    var vmin = valid_range[0];
    var rmin;
    var j;
    var v;
    var is_float = typeIsFloat(image.type);
    for (i = 0; i < image_min.array.length; i += 1) {
      if (debug) {
        console.log(i + " " + im_min[i] + " " + im_max[i] + " " +
                    im[i * n_slice_elements]);
      }
      if (is_float) {
        /* For floating-point volumes there is no scaling to be performed.
         * We do scan the data and make sure voxels are within the valid
         * range, and collect our statistics.
         */
        for (j = 0; j < n_slice_elements; j += 1) {
          v = im[n_voxels];
          if (v < valid_range[0] || v > valid_range[1]) {
            new_data[n_voxels] = 0.0;
          }
          else {
            new_data[n_voxels] = v;
            real_sum += v;
            if (v > real_max) {
              real_max = v;
            }
            if (v < real_min) {
              real_min = v;
            }
          }
          n_voxels += 1;
        }
      }
      else {
        /* For integer volumes we have to scale each slice according to image-min,
         * image-max, and valid_range.
         */
        vrange = (valid_range[1] - valid_range[0]);
        rrange = (im_max[i] - im_min[i]);
        rmin = im_min[i];
        for (j = 0; j < n_slice_elements; j += 1) {
          v = (im[n_voxels] - vmin) / vrange * rrange + rmin;
          new_data[n_voxels] = v;
          real_sum += v;
          n_voxels += 1;
          if (v > real_max) {
            real_max = v;
          }
          if (v < real_min) {
            real_min = v;
          }
        }
      }
    }

    if (debug) {
      console.log("Min: " + real_min);
      console.log("Max: " + real_max);
      console.log("Sum: " + real_sum);
      console.log("Mean: " + real_sum / n_voxels);
      console.log("Count: " + n_voxels);
    }

    return new_abuf;
  }

  /**
   * @doc function
   * @name hdf5.isRgbVolume
   * @param {object} header The header object representing the structure 
   * of the MINC file.
   * @param {object} image The typed array object used to represent the
   * image data.
   * @returns {boolean} True if this is an RGB volume.
   * @description
   * A MINC volume is an RGB volume if all three are true:
   * 1. The voxel type is unsigned byte.
   * 2. It has a vector_dimension in the last (fastest-varying) position.
   * 3. The vector dimension has length 3.
   */
  function isRgbVolume(header, image) {
    var order = header.order;
    return (image.array.constructor.name === 'Uint8Array' &&
            order.length > 0 &&
            order[order.length - 1] === "vector_dimension" &&
            header.vector_dimension.space_length === 3);
  }

  /**
   * @doc function
   * @name hdf5.rgbVoxels
   * @param {object} image The 'link' object created using createLink(),
   * that corresponds to the image within the HDF5 or NetCDF file.
   * @returns {object} A new ArrayBuffer that contains the original RGB 
   * data augmented with alpha values.
   * @description
   * This function copies the RGB voxels to the destination buffer.
   * Essentially we just convert from 24 to 32 bits per voxel. This
   * is another MINC-specific function.
   */
  function rgbVoxels(image) {
    var im = image.array;
    var n = im.length;
    var new_abuf = new ArrayBuffer(n / 3 * 4);
    var new_byte = new Uint8Array(new_abuf);
    var i, j = 0;
    for (i = 0; i < n; i += 3) {
      new_byte[j+0] = im[i+0];
      new_byte[j+1] = im[i+1];
      new_byte[j+2] = im[i+2];
      new_byte[j+3] = 255;
      j += 4;
    }
    return new_abuf;
  }

  /**
   * @doc function
   * @name VolumeViewer.utils.mincLoader
   * @param {object} data An ArrayBuffer object that contains the binary
   * data to be interpreted as an HDF5 file.
   *
   * @description This function is the primary entry point for loading
   * either MINC 1.0 or 2.0 files. It attempts to interpret the file
   * as an HDF5 (MINC 2.0) file. If that fails (e.g. throws an
   * exception), the code falls back to interpreting the file as a
   * NetCDF (MINC 1.0) file.
   */
  export function mincLoader (data) {
    const debug = true;

    let root;
    try {
      type_enum = HDF5_type_enum;
      root = hdf5Reader(data, debug);
    } catch (e) {
      if (debug) {
        console.log(e);
        console.log("Trying as NetCDF...");
      }
      try {
        type_enum = NetCDF_type_enum;
        root = netcdfReader(data, debug);
      } catch (er) {
        if (debug) {
          console.log(er);
          console.log("Failed as NetCDF...");
        }
      }
    }
    if (debug) {
      console.log('printing struct (too large)');
      // printStructure(root, 0);
    }

    /* The rest of this code is MINC-specific, so like some of the
     * functions above, it can migrate into minc.js once things have
     * stabilized.
     *
     * This code is responsible for collecting up the various pieces
     * of important data and metadata, and reorganizing them into the
     * form the volume viewer can handle.
     */
    var image = findDataset(root, "image");
    if (!defined(image)) {
      throw new Error("Can't find image dataset.");
    }
    var valid_range = findAttribute(image, "valid_range", 0);
    /* If no valid_range is found, we substitute our own. */
    if (!defined(valid_range)) {
      var min_val;
      var max_val;
      switch (image.type) {
      case type_enum.INT8:
        min_val = -(1 << 7);
        max_val = (1 << 7) - 1;
        break;
      case type_enum.UINT8:
        min_val = 0;
        max_val = (1 << 8) - 1;
        break;
      case type_enum.INT16:
        min_val = -(1 << 15);
        max_val = (1 << 15) - 1;
        break;
      case type_enum.UINT16:
        min_val = 0;
        max_val = (1 << 16) - 1;
        break;
      case type_enum.INT32:
        min_val = -(1 << 31);
        max_val = (1 << 31) - 1;
        break;
      case type_enum.UINT32:
        min_val = 0;
        max_val = (1 << 32) - 1;
        break;
      }
      valid_range = Float32Array.of(min_val, max_val);
    }
    var image_min = findDataset(root, "image-min");
    if (!defined(image_min) || !defined(image_min.array)) {
      image_min = {
        array: Float32Array.of(0),
        dims: []
      };
    }
    var image_max = findDataset(root, "image-max");
    if (!defined(image_max) || !defined(image_max.array)) {
      image_max = {
        array: Float32Array.of(1),
        dims: []
      };
    }

    /* Create the header expected by the existing brainbrowser code.
     */
    var header = {};
    var tmp = findAttribute(image, "dimorder", 0);
    if (typeof tmp !== 'string') {
      throw new Error("Can't find dimension order.");
    }
    header.order = tmp.split(',');

    header.order.forEach(function(dimname) {
      var dim = findDataset(root, dimname);
      if (!defined(dim)) {
        throw new Error("Can't find dimension variable " + dimname);
      }

      header[dimname] = {};

      tmp = findAttribute(dim, "step", 0);
      if (!defined(tmp)) {
        tmp = Float32Array.of(1);
      }
      header[dimname].step = tmp[0];

      tmp = findAttribute(dim, "start", 0);
      if (!defined(tmp)) {
        tmp = Float32Array.of(0);
      }
      header[dimname].start = tmp[0];

      tmp = findAttribute(dim, "length", 0);
      if (!defined(tmp)) {
        throw new Error("Can't find length for " + dimname);
      }
      header[dimname].space_length = tmp[0];

      tmp = findAttribute(dim, "direction_cosines", 0);
      if (defined(tmp)) {
        // why is the bizarre call to slice needed?? it seems to work, though!
        header[dimname].direction_cosines = Array.prototype.slice.call(tmp);
      }
      else {
        if (dimname === "xspace") {
          header[dimname].direction_cosines = [1, 0, 0];
        } else if (dimname === "yspace") {
          header[dimname].direction_cosines = [0, 1, 0];
        } else if (dimname === "zspace") {
          header[dimname].direction_cosines = [0, 0, 1];
        }
      }
    });

    var new_abuf;

    if (isRgbVolume(header, image)) {
      header.order.pop();
      header.datatype = 'rgb8';
      new_abuf = rgbVoxels(image);
    }
    else {
      header.datatype = 'float32';
      new_abuf = scaleVoxels(image, image_min, image_max, valid_range, debug);
    }

    return { header_text: JSON.stringify(header),
             raw_data: new_abuf};
  };
